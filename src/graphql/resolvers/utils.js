const _ = require('lodash');

/**
 * Check if the 'user' is following the target user.
 * @param {UserDocument} user - The user document
 * @param {String} targetUserId - The id that we are trying to find
 */
const isFollowingTargetUser = (user, targetUserId) =>
    _.find(user.following, (objId) => {
        return objId.toString() === targetUserId;
    });

/**
 * Check if the 'user' is followed by the target user.
 * @param {UserDocument} user - The user document
 * @param {*} targetUserId - The id that we are trying to find
 */
const isFollowedByTargetUser = (user, targetUserId) =>
    _.find(user.followers, (objId) => {
        return objId.toString() === targetUserId;
    });

module.exports = {
    isFollowingTargetUser,
    isFollowedByTargetUser,
};
