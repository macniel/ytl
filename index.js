/**
 * backend code
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const fs = require('fs');
const mime = require('mime');
const app = express();
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');

app.use(fileUpload());
app.use(cors());


app.get('/videos/:filename', (req, res) => {
    res.setHeader("content-type", "video/mp4");
    fs.createReadStream(path.join(__dirname, 'uploads', req.params['filename'])).pipe(res);
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

var upload = multer({ storage: storage }).single('files');

app.get('/files/:filename', (req, res) => {
    console.log('GET\t' + req.params['filename']);
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            res.status(200).sendFile(req.params['filename'], { root: path.join(__dirname, 'uploads') });
        } else {
            res.status(404).end();
        }
    });

})

app.get('/files/', (req, res) => {
    console.log('INDEX\t');
    fs.exists(path.join(__dirname, 'uploads', 'index.json'), (exists) => {
        if (exists) {
            console.log('INFO\tpath exists');
            return res.status(200).sendFile(path.join(__dirname, 'uploads', 'index.json'));
        } else {
            return res.status(500).end('index is not created');
        }
    });
});

function updateIndex(req, res, file, title, type) {
    let indexJson = [];
    if (fs.existsSync(path.join(__dirname, 'uploads', 'index.json'))) {
        indexJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploads', 'index.json')));
    } else {
        indexJson = [];
    }
    payload = {
        title: title,
        created: new Date(),
        filePath: file,
        isImage: type === 'image',
        isVideo: type === 'video'
    };
    console.log(payload);
    indexJson.push(payload);
    fs.writeFileSync(path.join(__dirname, 'uploads', 'index.json'), JSON.stringify(indexJson));
    return res.status(201).send(payload).end();
}

function recordExists(filename) {
    return fs.existsSync(path.join(__dirname, 'uploads', filename));
}

function convertVideoFile(tempFileName, cb) {
    var realFileName = tempFileName.replace(/\.temp$/g, '');
    try {
        var proc = new ffmpeg({ source: tempFileName })
            .usingPreset('divx')
            .on('end', function () {
                console.log('file has been converted succesfully');
                fs.rename(tempFileName, realFileName, (error) => {
                    console.log('file has been renamed for public');
                    cb(null, realFileName);
                });


            })
            .saveToFile(realFileName, function (stdout, stderr) {
            });

    } catch (e) {
        cb(e, tempFileName);
    }
}

app.post('/upload', (req, res) => {
    if (!req.files) {
        res.status(402).send('no files for upload sent').end();
    }
    const file = req.files.files;
    const title = req.body.title;
    console.log('RECV\t' + file);
    console.log('POST\t' + req.files.files.name);
    console.log('PROC\t');
    if (recordExists(file.name)) {
        return res.status(400).end('File already exists');
    }
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
                console.log('MOVE\t' + path.join(__dirname, 'uploads', fileName));

                if (type === 'video') {
                    console.log('vid');
                    convertVideoFile(path.join(__dirname, 'uploads', fileName), (error, newFilename) => {
                        updateIndex(req, res, path.join(destinationType, file.name), title, type);
                    });
                } else {
                    return updateIndex(req, res, path.join(destinationType, file.name), title, type);
                }
            });


        } else {
            console.error(error);
        }
    });



});

app.listen(3000, () => {
    console.log('Server is started on port 3000');
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
        console.log('\rINIT\tupload dir created');
    } else {
        console.log('\rINIT\tupload dir exists');
    }

});