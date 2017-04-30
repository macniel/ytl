const Tag = require('./models/tag.js');
const config = require('./config.js');
const mongoose = require('mongoose');


module.exports = function (options) {
    const superSecret = config.secret;
    try {
        mongoose.connect(config.database);
    } catch (e) {
        if (e.message !== 'Trying to open unclosed connection.') {
            console.error(e);
        }
    }
    this.getTag = function (id, done) {
        Tag.findOne({ tagId: id }, (error, result) => {

            done(error, {
                tagName: result.tagName,
                tagId: result.tagId
            });
        });
    }

    this.addTag = function (tagName, tagUri, done) {

        Tag.findOne({ tagName: tagName }, (error, result) => {
            if (!result) { // add new Tag
                const generatedId = Math.random().toString(36).substr(3, 10);
                new Tag({
                    tagId: generatedId,
                    uri: tagUri,
                    tagName: tagName
                }).save((error, result) => {
                    if (!error) {
                        done(null, { tagId: generatedId });
                    } else {
                        done(error, null);
                    }
                });
            } else { // return this tag
                done(null, { tagId: result.tagId });
            }
        });
    }
    return this;
};