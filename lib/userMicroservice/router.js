
module.exports = function (options) {
    const seneca = options.seneca;
    const __rootdir = options.__rootdir;

    const service = require('./logic.js')({ __rootdir: __rootdir });

    this.add({ user: 'login' }, (args, done) => {
        service.login(args.userName, args.password, (error, token) => {
            console.log(error, token);
            if (error) {
                done(new Error('Authentication failed. Wrong password or username.'), null);
            } else {
                done(null, { success: true, message: 'Welcome back' + args.UserName, token: token });
            }
        });


    });

    this.add({ user: 'logout' }, (args, done) => {
        // do the project:db trick
    });

    this.add({ user: 'verify' }, (args, done) => {
        service.verifyUser(args.token, (error, user) => {
            if (error) {
                done(new Error('Not authorized'), null);
            } else {
                done(null, user);
            }
        });

    });

    this.add({ user: 'register' }, (args, done) => {
        service.registerUser(args.userName, args.password, args.isCreator, args.avatarURL, (error, user) => {
            if (error) {
                done(new Error('Could not register new User'), null);
            } else {
                done(null, user);
            }
        });
    });

    return "user";
};