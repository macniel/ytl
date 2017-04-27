
module.exports = function (options) {
    const seneca = options.seneca;
    const __rootdir = options.__rootdir;
    const service = require('./services/file-info.js')({__rootdir: __rootdir});

    // seneca message bindings

    /**
     * performs a listing on the uploaded video files
     */
    this.add({ list: 'files' }, function (args, done) {
        done(null, service.listFiles());
    });

    /**
     * returns one specfic file record amongs the uploaded video files, also adds process info
     */
    this.add({ info: 'file' }, function (args, done) {

        const processId = args.processId;
        try {
            let file = service.getFile(processId);
            return seneca.act({ info: 'process', processId: processId }, (error, processData) => {
                file.processInfo = processData;
                done(null, file);
            });
        } catch (e) {
            if (e instanceof ReferenceError) {
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
            done(null, service.markFileForRelease(processId));
        } catch (e) {
            if (e instanceof ReferenceError ) {
                done(new Error('File not found'), null);
            }
        }
    });

    return 'file-info';
};
