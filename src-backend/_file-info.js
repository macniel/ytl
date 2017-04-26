const fs = require('fs');
const path = require('path');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;

    /**
     * performs a listing on the uploaded video files
     */
    this.add({ list: 'files' }, function (args, done) {
        let indexJson = [];
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        indexJson = JSON.parse(fs.readFileSync(filename));
        console.log('emitting', indexJson);
        done(null, indexJson);
    });

    /**
     * returns one specfic file record amongs the uploaded video files, also adds process info
     */
    this.add({ info: 'file' }, function (args, done) {
        const processId = args.processId;
        let indexJson = [];
        if (fs.existsSync(path.join(__rootdir, 'uploads', 'index.json'))) {
            indexJson = JSON.parse(fs.readFileSync(path.join(__rootdir, 'uploads', 'index.json')));
        } else {
            indexJson = [];
        }
        for (let file of indexJson) {
            if (file.processId == processId) {

                return seneca.act({ info: 'process', processId: processId }, (error, processData) => {
                    file.processInfo = processData;
                    return done(null, file);
                });
            }
        }

        done(new Error('File not found'), null);
    });

    /**
     * Updates a File Record and overwrites the contents if the given processId is already in use
     */
    this.add({ update: 'file' }, function (args, done) {
        const processId = args.processId;
        const posterFile = args.posterFile;
        const file = args.file;
        const title = args.title;
        const type = args.type;
        let indexJson = [];
        console.log('UPDATE\tprocesId', processId);

        if (fs.existsSync(path.join(__rootdir, 'uploads', 'index.json'))) {
            indexJson = JSON.parse(fs.readFileSync(path.join(__rootdir, 'uploads', 'index.json')));
        } else {
            indexJson = [];
        }
        payload = {
            title: title,
            created: new Date(),
            filePath: file,
            posterFilePath: posterFile,
            isImage: type === 'image',
            isVideo: type === 'video',
            isAvailable: type === 'image',
            processId: processId
        };
        let recordIndex = -1;
        for (let i = 0; i < indexJson.length; ++i) {
            if (indexJson[i].processId == processId) {
                recordIndex = i;
                break;
            }
        }
        if (recordIndex > -1) {
            indexJson[recordIndex] = payload;
        } else {
            indexJson.push(payload);
        }
        fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
        done(null, payload);
    });

    /**
     * Updates the filerecord for given processId to set it as available for video stream and download
     */
    this.add({ release: 'file' }, function (args, done) {
        const processId = args.processId;
        if (fs.existsSync(path.join(__rootdir, 'uploads', 'index.json'))) {
            indexJson = JSON.parse(fs.readFileSync(path.join(__rootdir, 'uploads', 'index.json')));
        } else {
            indexJson = [];
        }
        for (let file of indexJson) {
            if (file.processId === processId) {
                file.isAvailable = true;
                console.log('INFO\tupdated index releases');
                fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
                done(null, file);
                break;
            }
        }
    });

    return 'file-info';
};
