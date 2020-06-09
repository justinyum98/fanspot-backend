const UserModel = require('../models/User');

const findUserById = async (id) => {
    return new Promise((resolve, reject) => {
        UserModel.findById(id, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

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
    return new Promise((resolve, reject) => {
        UserModel.create(
            {
                username,
                password,
                email,
                isArtist: false,
                followers: [],
                following: [],
            },
            (err, user) => {
                if (err) reject(err);
                resolve(user);
            }
        );
    });
};

/**
 * Updates a user's 'followers' field
 * @param {String} userId - ID of follower
 * @param {String} targetId - ID of user being followed
 * @param {String} actionName - can either be 'add' or 'remove'
 */
const updateUserFollowers = async (userId, targetId, actionName) => {
    return new Promise((resolve, reject) => {
        let action;
        if (actionName === 'add') {
            action = { $push: { followers: targetId } };
        } else if (actionName === 'remove') {
            action = { $pull: { followers: targetId } };
        } else {
            reject(new Error('Action name not specified.'));
        }

        UserModel.findOneAndUpdate({ _id: userId }, action, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

/**
 * Updates a user's 'following' field
 * @param {*} userId - ID of user being followed
 * @param {*} targetId - ID of follower
 * @param {*} actionName - can either be 'add' or 'remove'
 */
const updateUserFollowing = async (userId, targetId, actionName) => {
    return new Promise((resolve, reject) => {
        let action;
        if (actionName === 'add') {
            action = { $push: { following: targetId } };
        } else if (actionName === 'remove') {
            action = { $pull: { following: targetId } };
        } else {
            reject(new Error('Action name not specified.'));
        }

        UserModel.findOneAndUpdate({ _id: userId }, action, (err, user) => {
            if (err) reject(err);
            resolve(user);
        });
    });
};

/**
 * Populates a user document.
 * Returns the populated user document.
 * @param {UserDocument} user
 */
const populateUser = async (user) => {
    return new Promise((resolve, reject) => {
        user.populate('followers')
            .populate('following')
            .execPopulate()
            .then(
                (populatedUser) => {
                    resolve(populatedUser);
                },
                (populateErr) => {
                    reject(populateErr);
                }
            );
    });
};

module.exports = {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    updateUserFollowers,
    updateUserFollowing,
    populateUser,
};
