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
app.use(fileUpload());
app.use(cors());

var seneca = require('seneca')()
seneca.use('./src-backend/_process-info.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./src-backend/_converter.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./src-backend/_file-info.js', { seneca: seneca, __rootdir: __dirname });



app.get('/videos/:filename', (req, res) => {
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            res.setHeader("content-type", "video/mp4");
            fs.createReadStream(path.join(__dirname, 'uploads', req.params['filename'])).pipe(res);
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
                    seneca.act({ convert: 'video', fileName: fileName }, (error, data) => {
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

app.listen(3000, () => {
    console.log('INIT\tServer is started on port 3000');
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
        console.log('\rINIT\tupload dir created');
    } else {
        console.log('\rINIT\tupload dir exists');
    }

});
