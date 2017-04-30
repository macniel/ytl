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

    listRelatedFiles = function (videoId) {
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        let indexJson = JSON.parse(fs.readFileSync(filename));
        let video = {
            tags: []
        };
        for (let file of indexJson) {

            if (file.videoId == videoId) {
                video = file;
                break;
            }
        };
        let basket = [];
        for (let tag of video.tags) {
            for (let targetFile of indexJson) {
                if (targetFile !== video && targetFile.tags.indexOf(tag) != -1) {
                    inserted = false;
                    for (let basketItem of basket) {

                        if (basketItem.id === targetFile.videoId) {
                            basketItem.score = basketItem.score + 1;
                            inserted = true;
                            break;
                        }
                    }
                    if (!inserted) {
                        basket.push({ score: 1, id: targetFile.videoId });
                    }
                }
            }
        }
        basket = basket.sort((a, b) => {
            return b.score - a.score;
        });
        return basket;

    }

    this.patchTagsInFile = function (videoId, tagId) {
        const filename = path.join(__rootdir, 'uploads', 'index.json');
        if (!fs.existsSync(filename)) {
            fs.writeFileSync(filename, JSON.stringify([]));
        }
        let indexJson = JSON.parse(fs.readFileSync(filename));
        let recordIndex = -1;
        let i = 0;
        for (i = 0; i < indexJson.length; ++i) {
            console.log(indexJson[i]);
            if (indexJson[i].videoId == videoId) {
                if (!indexJson[i].hasOwnProperty('tags')) {
                    indexJson[i].tags = [tagId];
                } else {
                    indexJson[i].tags.push(tagId);
                }

                console.log('RACE\tPatched Tags', indexJson[i]);
                fs.writeFileSync(path.join(__rootdir, 'uploads', 'index.json'), JSON.stringify(indexJson));
                return;

            }
        }

    }

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
            payload.tags = indexJson[recordIndex].tags;
            indexJson[recordIndex] = payload;
        } else {
            console.log('FILE\tcreated file', payload);
            indexJson.push(payload);
        }
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
