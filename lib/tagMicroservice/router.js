const fs = require('fs');
const path = require('path');

module.exports = function (options) {
    seneca = options.seneca;
    __rootdir = options.__rootdir;
    const service = require('./logic.js')({ __rootdir: __rootdir });


    this.add({ get: 'tag' }, function (args, done) {
        const tagId = args.tagId;
        service.getTag(tagId, (error, result) => {
            if (!error) {
                return done(null, result);
            } else {
                return done(error, null);
            }
        });

    });

    this.add({ add: 'tag' }, function (args, done) {
        const tagName = args.tagName.trim();
        const uri = args.uri;

        service.addTag(tagName, uri, (error, result) => {
            if (!error) {
                return done(null, result);
            } else {
                return done(error, null);
            }
        });
    });

    return "tag";
};