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

const seneca = require('seneca')()
seneca.use('./lib/process-info.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./lib/converter.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./lib/file-info.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./lib/user.js', { seneca: seneca, __rootdir: __dirname });
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
     stream.on("open", function() {
         stream.pipe(res);
     });
     stream.on("error", function(err) {
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
    console.log(req.body.userName, req.body.password);
    seneca.act({ user: 'register', userName: req.body.userName, password: req.body.password, isCreator: req.body.isCreator, avatarUrl: req.body.avatarUrl }, (error, user) => {
        console.log(error, user);
        res.status(201).send(user).end();
    });
});



app.get('/user', (req, res) => {

    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    seneca.act({ user: 'verify', token: token }, (error, user) => {
        if (!error) {
            res.status(200).send(user).end();
        } else {
            res.status(401).send(error.message).end();
        }
    });

});

app.post('/login', (req, res) => {
    seneca.act({ user: 'login', userName: req.body.userName, password: req.body.password }, (error, token) => {
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
    seneca.act({ list: 'files' }, (error, files) => {
        return res.status(200).send(files).end();
    });
});

app.get('/files/watch/:filename', (req, res) => {
    seneca.act({ info: 'file', processId: req.params['filename'] }, (error, file) => {
        if (!error) {
            return res.status(200).send(file).end();
        } else {
            return res.status(404).end();
        }
    });
});

app.get('/upload/status/:processId', (req, res) => {

    seneca.act({ info: 'file', processId: req.params['processId'] }, (error, file) => {
        if (!error) {
            res.send(file).status(200).end();
        } else {
            res.status(404).end();
        }
    });
});

/**
 * FIXME: serious need in refactoring as this route handler is way to big and should delegate most actions to the microservices
 */
app.post('/upload', (req, res) => {
    const token = req.body.token || req.query.token || req.headers['x-access-token'];
    seneca.act({ user: 'verify', token: token }, (error, user) => {
        if (!user.isCreator) {
            return res.status(401).send('You are not a creator').end();
        }
        if (!req.files) {
            res.status(402).send('no files for upload sent').end();
        }
        const file = req.files.files;
        const poster = req.files.poster;
        const title = req.body.title;

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
                        seneca.act({ convert: 'video', fileName: fileName, userName: user.userName }, (error, data) => {
                            const newFilename = data.fileName;
                            const processId = data.processId;
                            poster.mv(path.join(__dirname, 'uploads', poster.name), (err) => {
                                seneca.act({
                                    update: 'file',
                                    file: path.join(destinationType, newFilename),
                                    title: title,
                                    type: type,
                                    posterFile: path.join('files', poster.name),
                                    processId: processId
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
