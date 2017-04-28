const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');


module.exports = function (options) {
    ffmpeg.setFfmpegPath('c:\\ffmpeg\\bin\\ffmpeg.exe');
    const __rootdir = options.__rootdir;

    const registeredEventListener = {
        done: [],
        progress: [],
        start: []
    };

    this.on = function (message, callback) {
        if (registeredEventListener.hasOwnProperty(message) && callback instanceof Function) {
            registeredEventListener[message].push(callback);
        }
    }

    this.off = function (message, callback) {
        if (registeredEventListener.hasOwnProperty(message) && callback instanceof Function) {
            const index = registeredEventListener[message].indexOf(callback);
            registeredEventListener[message].splice(callback, 1);
        }
    }

    emit = function (message, payload) {
        if (registeredEventListener.hasOwnProperty(message)) {
            for (let callback of registeredEventListener[message]) {
                callback(payload);
            }
        }
    }

    /**
     * central component to convert a video file with given fileName to a video/mp4 file so that most browsers can play them back
     */
    this.convert = function (fileName) {
        const tempFileName = fileName;
        const processId = Math.random().toString(36).substr(3, 10);
        const realFileName = tempFileName.replace(/\.temp$/g, '');
        let timemark = 0;
        let proc = new ffmpeg({ source: path.join(__rootdir, 'uploads', tempFileName) })
            .videoCodec('libx264')
            .withAudioCodec('aac')
            .format('mp4');

        proc.on('end', function () {

            // clean up
            fs.unlinkSync(path.join(__rootdir, 'uploads', tempFileName));
            emit('done', {
                processId: processId,
                state: 'ACCESSIBLE',
                progress: 100,
                timemark: timemark
            });
        });
        proc.on('start', function (commandLine) {
            emit('start', {
                processId: processId,
                state: 'STARTED_CONVERTING',
                progress: 0
            });
        });
        proc.on('progress', function (progress) {
          timemark = progress.timemark;
            emit('progress', {
                processId: processId,
                state: 'CONVERTING',
                progress: progress.percent
            });
        });

        proc.saveToFile(path.join(__rootdir, 'uploads', realFileName), function (stdout, stderr) {
        });

        return { fileName: realFileName, processId: processId };

    };

    return this;
}
