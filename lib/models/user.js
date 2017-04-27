const mongoose = require('mongoose');
const Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
    userName: String,
    password: String,
    isCreator: Boolean,
    avatarUrl: String,
    userId: String
}));
