/**
 * backend code
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const fileUpload = require('express-fileupload');
const multer = require('multer');
const fs = require('fs');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const config = require('./lib/config');
const User = require('./lib/models/user');
const bcrypt = require('bcrypt');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(fileUpload());
app.use(cors());

app.set('superSecret', config.secret);

const seneca = require('seneca')()
seneca.use('./lib/process-info.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./lib/converter.js', { seneca: seneca, __rootdir: __dirname });
seneca.use('./lib/file-info.js', { seneca: seneca, __rootdir: __dirname });

const port = process.env.PORT || 3000;
mongoose.connect(config.database);


app.get('/videos/:filename', (req, res) => {
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            res.setHeader("content-type", "video/mp4");
            fs.createReadStream(path.join(__dirname, 'uploads', req.params['filename'])).pipe(res);
        } else {
            return res.status(404).end();
        }
    })

});

var storage = multer.diskStorage({
    // destino del fichero
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'uploads'));
    },
    // renombrar fichero
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

var upload = multer({ storage: storage }).fields(['files', 'poster']);

app.post('/register', (req, res) => {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const user = new User({
        name: req.body.name,
        password: hash,
        creator: req.body.isCreator,
        gravatarUrl: req.body.gravatar
    });

    console.log(user);

    user.save((error) => {
        res.status(201).send(user).end();
    });

});

app.get('/users', (req, res) => {
    User.find({}, (error, users) => {
        res.send(users).status(204).end();
    });
});

app.get('/user', (req, res) => {

    const token = req.body.token || req.query.token || req.headers['x-access-token'];

    jwt.verify(token, app.get('superSecret'), (error, user) => {
        if (!error) {
            res.status(200).send({
                name: user.name,
            creator: user.creator,
        gravatar: user.gravatarUrl}).end();
        } else {
            res.status(401).end();
        }
    });

});

app.post('/login', (req, res) => {
    User.findOne({ name: req.body.name }, (error, user) => {

        if (error) throw error;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {

            // check if password matches

            if (!bcrypt.compareSync(req.body.password, user.password)) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user.toJSON(), app.get('superSecret'), {
                    expiresIn: 60 * 60 * 24
                });

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }

        }
    });
});

app.get('/files/:filename', (req, res) => {
    fs.exists(path.join(__dirname, 'uploads', req.params['filename']), (exists) => {
        if (exists) {
            res.status(200).sendFile(req.params['filename'], { root: path.join(__dirname, 'uploads') });
        } else {
            res.status(404).end();
        }
    });

})

app.get('/files/', (req, res) => {
    seneca.act({ list: 'files' }, (error, files) => {
        return res.status(200).send(files).end();
    });
});

app.get('/upload/status/:processId', (req, res) => {

    seneca.act({ info: 'file', processId: req.params['processId'] }, (error, file) => {
        if (!error) {
            res.send(file).status(200).end();
        } else {
            res.status(404).end();
        }
    });
});

/**
 * FIXME: serious need in refactoring as this route handler is way to big and should delegate most actions to the microservices
 */
app.post('/upload', (req, res) => {
    if (!req.files) {
        res.status(402).send('no files for upload sent').end();
    }
    const file = req.files.files;
    const poster = req.files.poster;
    const title = req.body.title;

    upload(req, res, (error) => {

        if (!error) {
            let destinationType = '';
            let type = '';
            let fileName = '';
            if (file.mimetype.startsWith('image')) {
                destinationType = 'files';
                type = 'image';
                fileName = file.name;

            } else {
                destinationType = 'videos';
                type = 'video';
                fileName = file.name + '.temp';
            }
            file.mv(path.join(__dirname, 'uploads', fileName), (err) => {

                if (type === 'video') {
                    seneca.act({ convert: 'video', fileName: fileName }, (error, data) => {
                        const newFilename = data.fileName;
                        const processId = data.processId;
                        poster.mv(path.join(__dirname, 'uploads', poster.name), (err) => {
                            seneca.act({
                                update: 'file',
                                file: path.join(destinationType, newFilename),
                                title: title,
                                type: type,
                                posterFile: path.join('files', poster.name),
                                processId: processId
                            }, (error, result) => {
                                res.send(result).status(201).end();
                            });
                        })

                    });
                } else {
                }
            });


        } else {
            console.error(error);
        }
    });



});

app.listen(port, () => {
    console.log('INIT\tServer is started on port', port);
    if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
        console.log('\rINIT\tupload dir created');
    } else {
        console.log('\rINIT\tupload dir exists');
    }

});
