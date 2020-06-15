const _ = require('lodash');
const UserModel = require('../models/UserModel');

// PRIVATE HELPER METHODS
/**
 * Returns true if the user's following field contains the target user's id.
 * @param {Array} following - User document's following field
 * @param {String} targetUserId - Target user's id
 * @returns {boolean}
 */
const alreadyFollowingUser = (following, targetUserId) =>
    _.find(following, (userId) => {
        return userId.toString() === targetUserId;
    });

// MAIN METHODS

/**
 * Finds User document by user's id field.
 * @param {String} id - id of user
 * @returns {UserDocument}
 */
const findUserById = async (id) => {
    return new Promise((resolve, reject) => {
        UserModel.findById(id, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
};

const findUserByUsername = async ({ username }) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ username }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
        });
    });
};

const findUserByEmail = async ({ email }) => {
    return new Promise((resolve, reject) => {
        UserModel.findOne({ email }, (err, user) => {
            if (err) return reject(err);
            return resolve(user);
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
                if (err) return reject(err);
                return resolve(user);
            }
        );
    });
};

/**
 * Receives two unpopulated users and updates the current user's following and the target user's followers.
 * Resolves to an object containing both updated user documents.
 * @param {UserDocument} currentUserDoc - Document of user doing the following
 * @param {UserDocument} targetUserDoc - Document of user being followed
 * @returns {Promise} Promise object represents the updated user documents.
 */
const followUser = async (currentUserDoc, targetUserDoc) => {
    if (alreadyFollowingUser(currentUserDoc.following, targetUserDoc._id.toString()))
        throw new Error('Already following user.');

    try {
        currentUserDoc.following.push(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.push(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        // TODO: Handle error
        console.log(error);
        throw error;
    }

    return { currentUserDoc, targetUserDoc };
};

const unfollowUser = async (currentUserDoc, targetUserDoc) => {
    if (!alreadyFollowingUser(currentUserDoc.following, targetUserDoc._id.toString()))
        throw new Error('Already not following user.');

    try {
        currentUserDoc.following.pull(targetUserDoc.id);
        await currentUserDoc.save();

        targetUserDoc.followers.pull(currentUserDoc.id);
        await targetUserDoc.save();
    } catch (error) {
        // TODO: Handle error
        console.log(error);
        throw error;
    }

    return { currentUserDoc, targetUserDoc };
};

/**
 * Populates a user document.
 * Returns the populated user document.
 * @param {UserDocument} userDoc
 */
const populateUser = async (userDoc) => {
    return new Promise((resolve, reject) => {
        userDoc
            .populate('followers')
            .populate('following')
            .execPopulate()
            .then(
                (populatedUser) => {
                    return resolve(populatedUser);
                },
                (populateErr) => {
                    return reject(populateErr);
                }
            );
    });
};

module.exports = {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    populateUser,
    followUser,
    unfollowUser,
};
