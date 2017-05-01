const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');


module.exports = function (options) {
    ffmpeg.setFfmpegPath('/usr/local/bin/ffmpeg/ffmpeg');
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

    translateTimemark = function (timemark) {
        const split = timemark.split(':');
        return (parseInt(split[0]) * 60 + parseInt(split[1])) * 60 + parseInt(split[2])
    }

    /**
     * central component to convert a video file with given fileName to a video/mp4 file so that most browsers can play them back
     */
    this.convert = function (fileName, userId) {
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
                processOwnerId: userId,
                state: 'ACCESSIBLE',
                progress: 100,
                timemark: translateTimemark(timemark)
            });
        });
        proc.on('start', function (commandLine) {
            emit('start', {
                processId: processId,
                processOwnerId: userId,
                state: 'STARTED_CONVERTING',
                progress: 0
            });
        });
        proc.on('progress', function (progress) {
            timemark = progress.timemark;
            emit('progress', {
                processId: processId,
                processOwnerId: userId,
                state: 'CONVERTING',
                progress: progress.percent,
                timemark: progress.timemark
            });
        });

        proc.saveToFile(path.join(__rootdir, 'uploads', realFileName), function (stdout, stderr) {
        });

        return { fileName: realFileName, processId: processId };

    };

    return this;
}
