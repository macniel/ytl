const fs = require('fs');
const path = require('path');

module.exports = function(options) {

    const __rootdir = options.__rootdir;

    // internal functions

    this.listFiles = function () {
        let indexJson = [];
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        indexJson = JSON.parse(fs.readFileSync(filename));
        return indexJson;
    };

    this.getFile = function (processId) {

        let indexJson = listFiles();
        for (let file of indexJson) {
            if (file.processId == processId) {
                return file;
            }
        }
        throw new ReferenceError('file_not_found');
    };

    this.updateFile = function (fileInfo) {

        const processId = fileInfo.processId;
        const posterFile = fileInfo.posterFile;
        const file = fileInfo.file;
        const title = fileInfo.title;
        const type = fileInfo.type;
        let indexJson = listFiles();

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
    };

    this.markFileForRelease = function (processId) {
        indexJson = listFiles();
        for (let file of indexJson) {
            if (file.processId === processId) {
                file.isAvailable = true;
                fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
                return file;
                break;
            }
        }
        throw new ReferenceError('file_not_found');
    };

    return this;
}