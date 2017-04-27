const fs = require('fs');
const path = require('path');

const FILE_NOT_FOUND = 'FILE_NOT_FOUND';

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;

    // internal functions

    listFiles = function () {
        let indexJson = [];
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        indexJson = JSON.parse(fs.readFileSync(filename));
        return indexJson;
    }

    getFile = function (processId) {

        let indexJson = listFiles();
        for (let file of indexJson) {
            if (file.processId == processId) {
                return file;
            }
        }
        throw FILE_NOT_FOUND;
    }

    updateFile = function (fileInfo) {

        const processId = fileInfo.processId;
        const posterFile = fileInfo.posterFile;
        const file = fileInfo.file;
        const title = fileInfo.title;
        const type = fileInfo.type;
        let indexJson = listFiles();
        console.log('UPDATE\tprocesId', processId);

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
        return payload;
    }

    markFileForRelease = function (processId) {
        indexJson = listFiles();
        for (let file of indexJson) {
            if (file.processId === processId) {
                file.isAvailable = true;
                console.log('INFO\tupdated index releases');
                fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
                return file;
                break;
            }
        }
        return FILE_NOT_FOUND;
    }

    // seneca message bindings

    /**
     * performs a listing on the uploaded video files
     */
    this.add({ list: 'files' }, function (args, done) {
        done(null, listFiles());
    });

    /**
     * returns one specfic file record amongs the uploaded video files, also adds process info
     */
    this.add({ info: 'file' }, function (args, done) {
        const processId = args.processId;
        try {
            let file = getFile(processId);
            return seneca.act({ info: 'process', processId: processId }, (error, processData) => {
                file.processInfo = processData;
                done(null, file);
            });
        } catch (e) {
            console.log('ERROR\t' + e);
            if (e === FILE_NOT_FOUND) {
                done(new Error('File not found'), null);
            }
        }
    });

    /**
     * Updates a File Record and overwrites the contents if the given processId is already in use
     */
    this.add({ update: 'file' }, function (args, done) {
        done(null, updateFile(args));
    });

    /**
     * Updates the filerecord for given processId to set it as available for video stream and download
     */
    this.add({ release: 'file' }, function (args, done) {
        const processId = args.processId;
        try {
            done(null, markFileForRelease(processId));
        } catch (e) {
            if (e === FILE_NOT_FOUND) {
                done(new Error('File not found'), null);
            }
        }
    });

    return 'file-info';
};
