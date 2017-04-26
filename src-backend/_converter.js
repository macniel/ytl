const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;

    /**
     * central component to convert a video file with given fileName to a video/mp4 file so that most browsers can play them back
     */
    this.add({ convert: 'video' }, function (args, done) {
        tempFileName = args.fileName;
        let processId = Math.random().toString(36).substr(3, 10);
        let realFileName = tempFileName.replace(/\.temp$/g, '');
        let proc = new ffmpeg({ source: path.join(__rootdir, 'uploads', tempFileName) })
            .videoCodec('libx264')
            .withAudioCodec('aac')
            .format('mp4');
        proc.on('end', function () {
            console.log('INFO\tfile has been converted succesfully');
            fs.unlink(path.join(__rootdir, 'uploads', tempFileName), () => {
                seneca.act({
                    update: 'process', processId: processId, processInfo: {
                        processId: processId,
                        state: 'ACCESSIBLE',
                        progress: 100
                    }
                });
                seneca.act({ release: 'file', processId: processId });
            });
        });
        proc.on('start', function (commandLine) {
            seneca.act({
                update: 'process', processId: processId, processInfo: {
                    processId: processId,
                    state: 'STARTED_CONVERTING',
                    progress: 0
                }
            });
            console.log('INFO\tSpawned Ffmpeg with command: ' + commandLine);
        });
        proc.on('progress', function (progress) {
            seneca.act({
                update: 'process', processId: processId, processInfo: {
                    processId: processId,
                    state: 'CONVERTING',
                    progress: progress.percent
                }
            });
        });
        proc.saveToFile(path.join(__rootdir, 'uploads', realFileName), function (stdout, stderr) {
            console.log('INFO\tbeginning transcoding');
        });
        done(null, {fileName: realFileName, processId: processId});

    });

    return 'converter';
}
