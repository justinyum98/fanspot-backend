const _ = require('lodash');
const { AuthenticationError } = require('apollo-server-express');
const {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    updateUserFollowers,
    updateUserFollowing,
    populateUser,
} = require('../../database/dataAccess/User');
const { generateJWT, verifyJWT } = require('../../jwt');
const { isFollowingTargetUser, isFollowedByTargetUser } = require('./utils');
const { cacheUser } = require('../../redis/utils');

const Mutation = {
    Mutation: {
        login: async (parent, { username, password }) => {
            let user = await findUserByUsername({ username });
            if (!user) {
                throw new AuthenticationError('User with username does not exist.');
            }
            if (!(_.isEqual(username, user.username) && _.isEqual(password, user.password))) {
                throw new AuthenticationError('Username and/or password is incorrect.');
            }
            user = await populateUser(user);
            await cacheUser(user);
            const token = generateJWT(user.id, user.username);
            return { user, token };
        },
        register: async (parent, { username, password, email }) => {
            let user = await findUserByUsername({ username });
            if (user) {
                throw new AuthenticationError('Username is taken.');
            }
            user = await findUserByEmail({ email });
            if (user) {
                throw new AuthenticationError('Email is taken.');
            }
            let newUser = await createUser({ username, password, email });
            newUser = await populateUser(newUser);
            await cacheUser(newUser);
            const token = generateJWT(newUser.id, newUser.username);
            return { user: newUser, token };
        },
        follow: async (parent, { targetUserId }, { token }) => {
            const { id } = verifyJWT(token);
            let currentUser = await findUserById(id);
            if (isFollowingTargetUser(currentUser, targetUserId)) {
                throw new Error('You are already following that user.');
            }
            let targetUser = await findUserById(targetUserId);
            if (isFollowedByTargetUser(targetUser, id)) {
                // TODO: Handle this error, database mismatch
                throw new Error();
            }
            await updateUserFollowing(id, targetUserId, 'add');
            await updateUserFollowers(targetUserId, id, 'add');
            currentUser = await findUserById(id);
            targetUser = await findUserById(targetUserId);
            currentUser = await populateUser(currentUser);
            targetUser = await populateUser(targetUser);
            await cacheUser(currentUser);
            await cacheUser(targetUser);
            return { currentUser, targetUser };
        },
        unfollow: async (parent, { targetUserId }, { token }) => {
            const { id } = verifyJWT(token);
            let currentUser = await findUserById(id);
            if (!isFollowingTargetUser(currentUser, targetUserId)) {
                throw new Error('You are already not following that user.');
            }
            let targetUser = await findUserById(targetUserId);
            if (!isFollowedByTargetUser(targetUser, id)) {
                // TODO: Handle this error, database mismatch
                throw new Error();
            }
            await updateUserFollowing(id, targetUserId, 'remove');
            await updateUserFollowers(targetUserId, id, 'remove');
            currentUser = await findUserById(id);
            targetUser = await findUserById(targetUserId);
            currentUser = await populateUser(currentUser);
            targetUser = await populateUser(targetUser);
            await cacheUser(currentUser);
            await cacheUser(targetUser);
            return { currentUser, targetUser };
        },
    },
};

module.exports = { Mutation };
