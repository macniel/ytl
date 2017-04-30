
module.exports = function (options) {
    const seneca = options.seneca;
    const __rootdir = options.__rootdir;
    const service = require('./logic.js')({ __rootdir: __rootdir });


    function translateTagId(tagId) {
        return new Promise((resolve, reject) => {
            seneca.act({ get: 'tag', tagId: tagId }, (error, result) => {
                resolve({
                    tagId: result.tagId,
                    tagUri: result.tagUri,
                    tagName: result.tagName
                });
            });
        })
    }


    function translateTagName(tagName) {
        return new Promise((resolve, reject) => {
            seneca.act({ translate: 'tag', tagName: tagName }, (error, result) => {
                if ( result != null ) {
                resolve({
                    tagId: result.tagId,
                    tagUri: result.tagUri,
                    tagName: result.tagName
                });
                } else {
                    reject();
                }
            });
        })
    }


    // seneca message bindings

    /**
     * performs a listing on the uploaded video files
     */
    this.add({ list: 'files' }, function (args, done) {
        done(null, service.listFiles());
    });

    this.add({ search: 'files' }, function (args, done) {

        // translate query into ids

        // Map input data to an Array of Promises
        console.log(args.q.split(';'));
        let promises = args.q.split(';').map(tagName => {
            return translateTagName(tagName)
                .then(tagData => {
                    return tagData;
                })
        });

        Promise.all(promises)
            .then(results => {
                service.searchFiles(results, (error, result) => {
                    if (!error) {
                        done(null, result);
                    } else {
                        done(error, null);
                    }
                });

            })
            .catch(e => {
                done(e, null);
            })


    });

    this.add({ listRelated: 'files' }, function (args, done) {
        const videoId = args.videoId;
        done(null, service.listRelatedFiles(videoId));
    });

    /**
     * returns one specfic file record amongs the uploaded video files, also adds process info
     */
    this.add({ info: 'file' }, function (args, done) {
        const videoId = args.videoId;
        const userId = args.userId;
        try {
            let file = service.getFile(videoId);


            // Map input data to an Array of Promises
            let promises = file.tags.map(tagId => {
                return translateTagId(tagId)
                    .then(tagData => {
                        return tagData;
                    })
            });

            Promise.all(promises)
                .then(results => {
                    file.tags = results;
                    seneca.act({ user: 'byId', userId: file.ownerId }, (error, user) => {
                        if (user) {
                            file.ownerName = user.userName;
                            file.avatarUrl = user.avatarUrl;
                        }
                        done(null, file);
                    });
                })
                .catch(e => {
                    done(e, null);
                })
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
        const tags = args.tags;
        const payload = {
            file: args.file,
            title: args.title,
            type: args.type,
            posterFile: args.posterFile,
            videoId: args.videoId,
            ownerId: args.ownerId
        }

        for (let tag of tags) {
            seneca.act({ add: 'tag', tagName: tag, tagUri: '/search/' }, (error, result) => {
                console.log('patching tag', tag, result.tagId);
                service.patchTagsInFile(payload.videoId, result.tagId);
            });
        }
        done(null, service.updateFile(payload));
    });

    /**
     * Updates the filerecord for given processId to set it as available for video stream and download
     */
    this.add({ release: 'file' }, function (args, done) {
        const videoId = args.videoId;
        const userId = args.userId;
        const timemark = args.timemark;
        try {
            done(null, service.markFileForRelease(videoId, userId, timemark));
        } catch (e) {
            if (e instanceof ReferenceError) {
                done(new Error('File not found'), null);
            }
        }
    });

    return 'file-info';
};
