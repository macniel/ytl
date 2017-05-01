
module.exports = function (options) {
    const seneca = options.seneca;
    const __rootdir = options.__rootdir;
    const service = require('./logic.js')({ __rootdir: __rootdir });


    this.translateTagId = (tagId) => {
        return new Promise((resolve, reject) => {
            console.log('trying to contact tagService');
            this.act({ service: 'tag', tag: 'get', tagId: tagId }, (error, result) => {
                resolve({
                    tagId: result.tagId,
                    tagUri: result.tagUri,
                    tagName: result.tagName
                });
            });
        })
    }


    this.translateTagName = (tagName) => {
        return new Promise((resolve, reject) => {
            this.act({ service: 'tag', tag: 'translate', tagName: tagName }, (error, result) => {
                if (result != null) {
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
    this.add({ service: 'file', file: 'list' }, (args, done) => {
        done(null, service.listFiles());
    });

    this.add({ service: 'file', file: 'search' }, (args, done) => {

        // translate query into ids

        // Map input data to an Array of Promises
        let promises = args.q.split(';').map(tagName => {
            return this.translateTagName(tagName)
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

    this.add({ service: 'file', file: 'listRelated' }, (args, done) => {
        const videoId = args.videoId;
        done(null, service.listRelatedFiles(videoId));
    });

    /**
     * returns one specfic file record amongs the uploaded video files, also adds process info
     */
    this.add({ service: 'file', file: 'info' }, (args, done) => {
        const videoId = args.videoId;
        const userId = args.userId;
        try {
            let file = service.getFile(videoId);
            if (!file.tags) {
                file.tags = [];
            }
            done(null, file);
            /*
                        // Map input data to an Array of Promises
                        let promises = file.tags.map(tagId => {
                            return this.translateTagId(tagId)
                                .then(tagData => {
                                    return tagData;
                                })
                        });

                        Promise.all(promises)
                            .then(results => {
                                file.tags = results;
                                this.act({ service: 'user', user: 'byId', userId: file.ownerId }, (error, user) => {
                                    if (user) {
                                        file.ownerName = user.userName;
                                        file.avatarUrl = user.avatarUrl;
                                    }
                                    done(null, file);
                                });
                                done(null, file);
                            })
                            .catch(e => {
                                console.log('Errro\'d\t', e);
                                done(e, null);
                            })*/
        } catch (e) {
            if (e instanceof ReferenceError) {
                done(new Error('File not found'), null);
            }
        }
    });

    /**
     * Updates a File Record and overwrites the contents if the given processId is already in use
     */
    this.add({ service: 'file', file: 'update' }, (args, done) => {
        const tags = args.tags;
        const payload = {
            file: args.fileName,
            title: args.title,
            type: args.type,
            posterFile: args.posterFile,
            videoId: args.videoId,
            ownerId: args.ownerId
        }
        console.log('UPDATE', args.videoId, new Date());
        for (let tag of tags) {
            this.act({ service: 'tag', add: 'tag', tagName: tag, tagUri: '/search/' }, (error, result) => {
                console.log('patching tag', tag, result.tagId);
                service.patchTagsInFile(payload.videoId, result.tagId);
            });
        }
        done(null, service.updateFile(payload));
    });

    /**
     * Updates the filerecord for given processId to set it as available for video stream and download
     */
    this.add({ service: 'file', file: 'release' }, (args, done) => {
        const videoId = args.videoId;
        const userId = args.userId;
        const timemark = args.timemark;
        console.log('Releasing file for public\t' + args.videoId, new Date());
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
