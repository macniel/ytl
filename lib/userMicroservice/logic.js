const User = require('./models/user.js');
const bcrypt = require('bcrypt');
const config = require('./config.js');
const jwt = require('jsonwebtoken');
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
    this.login = function (userName, password, done) {
        User.findOne({ userName: userName }, (error, user) => {

            if (error) {
                done(new Error('Invalid Credentials'), null);
            }

            if (!user) {
                done(new Error('Invalid Credentials'), null);
            } else if (user) {

                if (!bcrypt.compareSync(password, user.password)) {
                    done(new Error('Invalid Credentials'), null);
                } else {
                    let payload = user.toJSON();
                    let token = jwt.sign(payload, superSecret, {
                        expiresIn: 60 * 60 * 24
                    });
                    done(null, token);
                }

            }
        });
    };

    this.getUserById = function (userId, done) {
        User.findOne({ userId: userId }, (error, user) => {
            if (user.isCreator) {
                done(null, { userName: user.userName, avatarUrl: user.avatarUrl });
            } else {
                done(new Error('User is not a creator'), null);
            }
        });
    }

    this.verifyUser = function (token, done) {

        jwt.verify(token, superSecret, (error, dbUser) => {
            if (!error) {
                User.findOne({ userId: dbUser.userId }, (error, user) => {
                    console.log(dbUser, user);
                    if (user != null) {
                        done(null, {
                            userName: user.userName,
                            isCreator: user.isCreator,
                            avatar: user.avatarUrl,
                            userId: user.userId
                        });
                    } else {
                        done(new Error('User does not exists'), null);
                    }

                });
            } else {
                done(new Error('User does not exists'), null);
            }
        });
    }

    this.registerUser = function (userName, password, isCreator, avatarURL, done) {

        const salt = bcrypt.genSaltSync(10);
        const userId = Math.random().toString(36).substr(3, 10);
        const hash = bcrypt.hashSync(password, salt);

        const payload = {
            userName: userName,
            password: hash,
            isCreator: isCreator,
            avatarUrl: avatarURL,
            userId: userId
        };

        User.findOne({ userName: payload.userName }, (error, result) => {
            if (!result) { // not found, good job
                const user = new User(payload);
                user.save((error) => {
                    if (error) {
                        done(new Error('Could not save user'), null);
                    } else {
                        done(null, payload);
                    }
                });
            } else { // user already exists, abort
                done(new Error('User already exists'), null);
            }
        });
    }

    return this;
};