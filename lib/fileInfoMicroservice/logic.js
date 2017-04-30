const fs = require('fs');
const path = require('path');

module.exports = function (options) {

    const __rootdir = options.__rootdir;

    // internal functions

    this.listFiles = function () {
        let indexJson = [];
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        indexJson = JSON.parse(fs.readFileSync(filename)).filter((file) => { return file.isAvailable === true });
        return indexJson;
    };

    this.getFile = function (videoId) {
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        let indexJson = JSON.parse(fs.readFileSync(filename));
        for (let file of indexJson) {

            if (file.videoId == videoId) {
                return file;
            }
        }
        throw new ReferenceError('file_not_found');
    };

    this.updateFile = function (fileInfo) {
        console.log('updateFile', fileInfo);
        const videoId = fileInfo.videoId;
        const posterFile = fileInfo.posterFile;
        const file = fileInfo.file;
        const title = fileInfo.title;
        const type = fileInfo.type;
        const ownerId = fileInfo.ownerId;
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        let indexJson = JSON.parse(fs.readFileSync(filename));
        if (!indexJson) {
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
            videoId: videoId,
            ownerId: ownerId
        };
        let recordIndex = -1;
        for (let i = 0; i < indexJson.length; ++i) {
            if (indexJson[i].processId == videoId) {
                recordIndex = i;
                break;
            }
        }
        if (recordIndex > -1) {
            console.log('FILE\tupdated file', payload);
            indexJson[recordIndex] = payload;
        } else {
            console.log('FILE\tcreated file', payload);
            indexJson.push(payload);
        }
        console.log(path.join(__rootdir, 'uploads', 'index.json'), indexJson);
        fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
        return payload;
    };

    this.markFileForRelease = function (videoId, userId, timemark) {
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        const indexJson = JSON.parse(fs.readFileSync(filename));

        for (let file of indexJson) {
            if (file.videoId === videoId) {
                file.isAvailable = true;
                file.ownerId = userId;
                file.timemark = timemark;
                fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
                return file;
                break;
            }
        }
        throw new ReferenceError('file_not_found');
    };

    return this;
}
