const fs = require('fs');
const path = require('path');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;

    /**
     * central component to convert a video file with given fileName to a video/mp4 file so that most browsers can play them back
     */
    this.add({ convert: 'video' }, function (args, done) {
      const userId = args.user;
      const service = require('./services/converter.js')({ __rootdir: __rootdir });

        service.on('start', (info) => {
            seneca.act({
                update: 'process',
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
            seneca.act({
                update: 'process', processId: info.processId, processInfo: {
                    processId: info.processId,
                    state: info.state,
                    progress: info.progress
                }
            });
        });

        service.on('done', (info) => {

            console.log('INFO\tfile has been converted succesfully');
            seneca.act({
                update: 'process', processId: info.processId, processInfo: {
                    processId: info.processId,
                    state: 'ACCESSIBLE',
                    progress: 100
                }
            });
            seneca.act({ release: 'file', videoId: info.processId, userId: userId, length: info.length });
        });

        const processSignature = service.convert(args.fileName);

        done(null, {
            fileName: processSignature.fileName,
            videoId: processSignature.processId
        });

    });

    return 'converter';
}
