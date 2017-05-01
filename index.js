/**
 * backend code
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const fs = require('fs');
const app = express();

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(fileUpload());
app.use(cors());

const seneca = require('seneca')().client({ port: 10101, type: 'http' });
const port = process.env.PORT || 3000;


app.get('/videos/:filename', (req, res) => {
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {

            var range = req.headers.range;
            if (!range) {
                // 416 Wrong range
                return res.sendStatus(416);
            }
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            const stats = fs.statSync(path.join(__dirname, 'uploads', req.params['filename']));
            var total = stats.size;
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            var chunksize = (end - start) + 1;

            res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "video/mp4"
            });

            const stream = fs.createReadStream(path.join(__dirname, 'uploads', req.params['filename']), { start: start, end: end });
            stream.on("open", function () {
                stream.pipe(res);
            });
            stream.on("error", function (err) {
                res.end(err);
            });
        } else {
            return res.status(404).end();
        }
    })

});

var storage = multer.diskStorage({
    // destino del fichero
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    // renombrar fichero
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

var upload = multer({ storage: storage }).fields(['files', 'poster']);

app.post('/register', (req, res) => {
    seneca.act({ service: 'user', user: 'register', userName: req.body.userName, password: req.body.password, isCreator: req.body.isCreator, avatarUrl: req.body.avatarUrl }, (error, user) => {
        res.status(201).send(user).end();
    });
});



app.get('/user', (req, res) => {

    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    seneca.act({ service: 'user', user: 'verify', token: token }, (error, user) => {
        if (!error) {
            res.status(200).send(user).end();
        } else {
            res.status(401).send(error.message).end();
        }
    });

});

app.post('/login', (req, res) => {
    seneca.act({ service: 'user', user: 'login', userName: req.body.userName, password: req.body.password }, (error, token) => {
        if (!error) {
            res.status(200).send(token).end();
        } else {
            res.status(401).send(error).end();
        }
    });
});

app.get('/files/:filename', (req, res) => {
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            res.status(200).sendFile(req.params['filename'], { root: path.join(__dirname, 'uploads') });
        } else {
            res.status(404).end();
        }
    });

})

app.get('/files/', (req, res) => {
    if (req.query.q != null && req.query.q.trim() !== '') {


        seneca.act({ service: 'file', file: 'search', q: req.query.q }, (error, files) => {
            if (!files || files.length === 0) {
                return res.status(204).send([]).end();
            } else {
                return res.status(200).send(files).end();
            }

        });

    } else {


        seneca.act({ service: 'file', file: 'list' }, (error, files) => {
            if (files.length > 0) {
                return res.status(200).send(files).end();
            } else {
                return res.status(204).send([]).end();
            }

        });
    }
});

app.get('/files/watch/:filename', (req, res) => {
    seneca.act({ service: 'file', file: 'info', videoId: req.params['filename'] }, (error, file) => {
        if (!error) {
            seneca.act({ service: 'file', file: 'listRelated', videoId: file.videoId }, (error, relatedFiles) => {
                file.relatedFiles = relatedFiles;
                return res.status(200).send(file).end();
            })
        } else {
            return res.status(404).end();
        }
    });
});

app.get('/upload/status/:processId', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    seneca.act({ service: 'user', user: 'verify', token: token }, (error, user) => {
        if (error) {
            return res.status(401).end();
        }
        seneca.act({ service: 'process', process: 'info', processId: req.params['processId'], userId: user.userId }, (error, file) => {

            if (!error) {
                res.send({processInfo:file}).status(200).end();
            } else {
                res.status(404).end();
            }


        });
    });
});

app.get('/uploads', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    seneca.act({ service: 'user', user: 'verify', token: token }, (error, user) => {
        if (error) {
            return res.status(401).end();
        }
        seneca.act({ service: 'process', process: 'list', userId: user.userId }, (error, files) => {
            if (!error) {
                if (files.length > 0) {
                    res.send(files).status(200).end();
                } else {
                    res.status(204).send([]).end();
                }
            } else {
                res.send(new Error('Not authorized')).status(401).end();
            }

        });
    });
});

/**
 * FIXME: serious need in refactoring as this route handler is way to big and should delegate most actions to the microservices
 */
app.post('/upload', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    seneca.act({ service: 'user', user: 'verify', token: token }, (error, user) => {
        if (!user.isCreator) {
            return res.status(401).send('You are not a creator').end();
        }
        if (!req.files) {
            res.status(402).send('no files for upload sent').end();
        }
        const file = req.files.files;
        const poster = req.files.poster;
        const title = req.body.title;
        const tags = req.body.tags.split(";");

        upload(req, res, (error) => {

            if (!error) {
                let destinationType = '';
                let type = '';
                let fileName = '';
                if (file.mimetype.startsWith('image')) {
                    destinationType = 'files';
                    type = 'image';
                    fileName = file.name;

                } else {
                    destinationType = 'videos';
                    type = 'video';
                    fileName = file.name + '.temp';
                }
                file.mv(path.join(__dirname, 'uploads', fileName), (err) => {

                    if (type === 'video') {
                        seneca.act({ service: 'convert', convert: 'video', fileName: fileName, user: user.userId }, (error, data) => {
                            const newFilename = data.fileName;
                            const videoId = data.videoId;
                            poster.mv(path.join(__dirname, 'uploads', poster.name), (err) => {
                                console.log('main\tUpdate File');
                                seneca.act({
                                    service: 'file',
                                    file: 'update',
                                    fileName: path.join(destinationType, newFilename),
                                    title: title,
                                    type: type,
                                    posterFile: path.join('files', poster.name),
                                    videoId: videoId,
                                    ownerId: user.userId,
                                    tags: tags
                                }, (error, result) => {
                                    res.send(result).status(201).end();
                                });
                            })

                        });
                    } else {
                    }
                });


            } else {
                console.error(error);
            }
        });

    });

});

app.listen(port, () => {
    console.log('INIT\tServer is started on port', port);
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
        console.log('\rINIT\tupload dir created');
    } else {
        console.log('\rINIT\tupload dir exists');
    }

});
