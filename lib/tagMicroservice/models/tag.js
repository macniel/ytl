const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('Tag', new Schema({
    tagId: String,
    tagName: String,
    uri: String
}));