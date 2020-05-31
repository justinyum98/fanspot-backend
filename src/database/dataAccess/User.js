const { v4: uuidv4 } = require('uuid');
const UserModel = require('../models/User');

const findUserByUsername = async ({ username }) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

const findUserByEmail = async ({ email }) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ email }, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

const createUser = async ({ username, password, email }) => {
    const uuid = uuidv4();
    const isArtist = false;

    return new Promise((resolve, reject) => {
        UserModel.create({ uuid, username, password, email, isArtist }, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

module.exports = {
    findUserByUsername,
    findUserByEmail,
    createUser,
};
