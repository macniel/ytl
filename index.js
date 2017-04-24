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
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            console.log('STREAM\t', path.join(__dirname, 'uploads', req.params['filename']), 'filesize: ', fs.statSync(path.join(__dirname, 'uploads', req.params['filename'])).size);
            res.setHeader("content-type", "video/mp4");
            res.setHeader("Content-Length", fs.statSync(path.join(__dirname, 'uploads', req.params['filename'])).size);
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
            fs.writeFileSync(path.join(__dirname, 'uploads', 'index.json'), JSON.stringify([]));
            return res.status(200).sendFile(path.join(__dirname, 'uploads', 'index.json'));
        }
    });
});



function updateIndex(req, res, file, title, type, posterFileName, processId) {
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
        posterFilePath: posterFileName,
        isImage: type === 'image',
        isVideo: type === 'video',
        isAvailable: type === 'image',
        processId: processId
    };
    console.log(payload);
    indexJson.push(payload);
    fs.writeFileSync(path.join(__dirname, 'uploads', 'index.json'), JSON.stringify(indexJson));
    return res.status(201).send(payload).end();
}

function recordExists(filename) {
    return fs.existsSync(path.join(__dirname, 'uploads', filename));
}

function updateIndexRelease(processId) {
    if (fs.existsSync(path.join(__dirname, 'uploads', 'index.json'))) {
        indexJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploads', 'index.json')));
    } else {
        indexJson = [];
    }
    for (let file of indexJson) {
        if (file.processId === processId) {
            file.isAvailable = true;
            break;
        }
    }
    console.log('updated index releases');
    fs.writeFileSync(path.join(__dirname, 'uploads', 'index.json'), JSON.stringify(indexJson));
}


let processData = [

];
let processId = 0;
app.get('/upload/status/:processId', (req, res) => {
    if (fs.existsSync(path.join(__dirname, 'uploads', 'index.json'))) {
        indexJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'uploads', 'index.json')));
    } else {
        indexJson = [];
    }
    for (let file of indexJson) {
        if (file.processId === processId) {
            for (let process of processData) {
                if (process.processId === file.processId) {
                    file.processInfo = process;
                }
            }
            return res.status(200).send(file).end();
        }
    }
    return res.status(404).send('process not available').end;
});


function prepareProcessInfo(processId) {
    let processInfo = processData.find((value) => {
        return value.processId === processId;
    });
    if (!processInfo) {
        processInfo = {
            processId: processId,
            state: 'CREATED',
            progress: '0'
        };
        console.log('created processData for processId', processId);
        processData.push(processInfo);
        console.log('pending processes', processData);
    }
    return processInfo;
}

function convertVideoFile(tempFileName, cb) {
    let realFileName = tempFileName.replace(/\.temp$/g, '');
    let thisProcessId = processId;
    let processInfo = prepareProcessInfo(thisProcessId);

    console.log('sourceFile: ', fs.existsSync(path.join(__dirname, 'uploads', tempFileName)) ? 'exists' : ' does not exist');
    console.log('targetFile: ', fs.existsSync(path.join(__dirname, 'uploads', realFileName)) ? 'exists' : ' does not exist');

    var proc = new ffmpeg({ source: path.join(__dirname, 'uploads', tempFileName) })
        .videoCodec('libx264')
        .withAudioCodec('aac')
        .format('mp4')

        .on('end', function () {
            console.log('file has been converted succesfully');
            processInfo.state = 'FINISHED_CONVERTING';
            fs.unlink(path.join(__dirname, 'uploads', tempFileName), () => {
                processInfo.state = 'ACCESSIBLE';
                updateIndexRelease(processId);
            });
        })
        .on('start', function (commandLine) {

            processInfo.state = 'STARTED_CONVERTING';

            console.log('Spawned Ffmpeg with command: ' + commandLine);
        })
        .on('progress', function (progress) {
            processInfo.state = 'CONVERTING';
            processInfo.progress = progress.percent;
            console.log('Processing: ' + progress.percent + '% done');
        })
        .saveToFile(path.join(__dirname, 'uploads', realFileName), function (stdout, stderr) {
            processInfo.state = 'STARTED_TRANSCODING';
            console.log('beginning transcoding');
        });
    cb(null, realFileName, thisProcessId);

}

app.post('/upload', (req, res) => {
    if (!req.files) {
        res.status(402).send('no files for upload sent').end();
    }
    const file = req.files.files;
    const poster = req.files.poster;
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
                    convertVideoFile(fileName, (error, newFilename, processId) => {
                        poster.mv(path.join(__dirname, 'uploads', poster.name), (err) => {
                            console.log('New FileName', newFilename, 'Poster FileName', poster.name);
                            processId++;
                            return updateIndex(req, res, path.join(destinationType, newFilename), title, type, path.join('files', poster.name), processId - 1);
                        })

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