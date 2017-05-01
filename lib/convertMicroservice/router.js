const fs = require('fs');
const path = require('path');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;

    /**
     * central component to convert a video file with given fileName to a video/mp4 file so that most browsers can play them back
     */
    this.add({ service: 'convert', convert: 'video' }, (args, done) => {
        const userId = args.user;
        const service = require('./logic.js')({ __rootdir: __rootdir });

        service.on('start', (info) => {
            console.log('trying to call\tprocess:update');
            this.act({
                service: 'process',
                process: 'update',
                processId: info.processId,
                processInfo: {
                    processOwnerId: userId,
                    processId: info.processId,
                    state: info.state,
                    progress: info.progress
                }
            });
        });

        service.on('progress', (info) => {
            this.act({
                service: 'process',
                process: 'update', processId: info.processId, processInfo: {
                    processId: info.processId,
                    processOwnerId: info.processOwnerId,
                    state: info.state,
                    progress: info.progress
                },
                userId: userId
            });
        });

        service.on('done', (info) => {
            console.log('INFO\tfile has been converted succesfully');

             this.act({
                service: 'process',
                process: 'update',
                processId: info.processId,
                processInfo: {
                    processOwnerId: info.userId,
                    processId: info.processId,
                   state: 'ACCESSIBLE',
                    progress: 100
                },
                userId: userId
            }, (error, result) => {
                console.log('Process updated for the last time');
            });

            this.act({
                service: 'file',
                file: 'release', videoId: info.processId, userId: userId, timemark: info.timemark
            }, (error, result) => {
                console.log('File is released');
            });
        });

        const processSignature = service.convert(args.fileName, userId);

        done(null, {
            fileName: processSignature.fileName,
            videoId: processSignature.processId
        });

    });

    return 'converter';
}
