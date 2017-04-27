const User = require('./models/user.js');
const bcrypt = require('bcrypt');
const config = require('./config.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


module.exports = function (options) {
    const seneca = options.seneca;
    const __rootdir = options.__rootdir;
    const superSecret = config.secret;
    mongoose.connect(config.database);
    //const service = require('./services/user.js')({ __rootdir: __rootdir });

    this.add({ user: 'login' }, (args, done) => {
        User.findOne({ userName: args.userName }, (error, user) => {

            if (error) throw error;

            if (!user) {
                done(new Error('Authentication failed. Wrong username.'), null);
            } else if (user) {

                if (!bcrypt.compareSync(args.password, user.password)) {
                    done(new Error('Authentication failed. Wrong password.'), null);
                } else {
                    let payload = user.toJSON();
                    console.log(config);
                    let token = jwt.sign(payload, superSecret, {
                        expiresIn: 60 * 60 * 24
                    });

                    done(null, {
                        success: true,
                        message: 'Enjoy your token!',
                        token: token
                    });
                }

            }
        });

    });

    this.add({ user: 'logout' }, (args, done) => {
        // do the project:db trick
    });

    this.add({ user: 'verify' }, (args, done) => {
        const token = args.token;
        console.log(token);
        jwt.verify(token, superSecret, (error, dbUser) => {
            if (!error) {
                User.findOne({ userId: dbUser.userId }, (error, user) => {
                    console.log(user);
                    done(null, {
                        userName: user.userName,
                        isCreator: user.isCreator,
                        avatar: user.avatarUrl,
                        userId: user.userId
                    });

                });

            } else {
                done(new Error('Not authenticated'), null);
            }
        });

    });

    this.add({ user: 'register' }, (args, done) => {
        const salt = bcrypt.genSaltSync(10);
        const userId = Math.random().toString(36).substr(3, 10);

        console.log(args.userName, args.password);
        const hash = bcrypt.hashSync(args.password, salt);

        const payload = {
            userName: args.userName,
            password: hash,
            isCreator: args.isCreator,
            avatarUrl: args.avatarUrl,
            userId: userId
        };

        const user = new User(payload);

        user.save((error) => {
            if (error) {
                done(error, null);
            } else {
                done(null, payload);
            }
        });

    });

    return "user";
};