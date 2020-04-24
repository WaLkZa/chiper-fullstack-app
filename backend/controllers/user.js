const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user')

exports.registerUser = (req, res, next) => {
    const name = req.body.username;
    const password = req.body.password;

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = User.create({
                name: name,
                password: hashedPassword
            })

            return user;
        })
        .then(result => {
            const jsonWebToken = createJsonWebToken(result.id, result.name);

            res.status(201).json({
                message: 'User created!',
                token: jsonWebToken,
                userId: result.id,
                username: result.name
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }

            next(err);
        });
}

exports.loginUser = (req, res, next) => {
    const name = req.body.username;
    const password = req.body.password;
    let loadedUser;

    User.findOne({
            where: {
                name: name
            }
        })
        .then(user => {
            if (!user) {
                const error = new Error("A user with this name could not be found!")
                error.statusCode = 401;
                throw error;
            }

            loadedUser = user;
            return bcrypt.compare(password, user.password);
        })
        .then(isEqual => {
            if (!isEqual) {
                const error = new Error('Wrong password!');
                error.statusCode = 401;
                throw error;
            }

            const jsonWebToken = createJsonWebToken(loadedUser.id, loadedUser.name)

            res.status(200).json({
                token: jsonWebToken,
                userId: loadedUser.id,
                username: loadedUser.name
            })
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }

            next(err);
        });
}

function createJsonWebToken(id, username) {
    return jwt.sign({
            userId: id,
            name: username
        },
        'somesupersecretsecret', {
            expiresIn: '1h'
        }
    );
}