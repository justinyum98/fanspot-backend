const _ = require('lodash');
const { AuthenticationError } = require('apollo-server-express');
const {
    findUserById,
    findUserByUsername,
    findUserByEmail,
    createUser,
    followUser,
    unfollowUser,
} = require('../../database/dataAccess/User');
const { generateJWT, verifyJWT } = require('../../utils/jwt');
const { cacheUser } = require('../../redis/actions');

const Mutation = {
    Mutation: {
        login: async (parent, { username, password }) => {
            const user = await findUserByUsername({ username });
            if (!user) {
                throw new AuthenticationError('User with username does not exist.');
            }
            if (!(_.isEqual(username, user.username) && _.isEqual(password, user.password))) {
                throw new AuthenticationError('Username and/or password is incorrect.');
            }
            await cacheUser(user);
            const token = generateJWT(user.id, user.username);
            return { user: user.toObject(), token };
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
            const newUser = await createUser({ username, password, email });
            await cacheUser(newUser);
            const token = generateJWT(newUser.id, newUser.username);
            return { user: newUser.toObject(), token };
        },
        follow: async (parent, { targetUserId }, { token }) => {
            const { id } = verifyJWT(token);
            let currentUser = await findUserById(id);
            let targetUser = await findUserById(targetUserId);
            const { currentUserDoc, targetUserDoc } = await followUser(currentUser, targetUser);
            currentUser = currentUserDoc;
            targetUser = targetUserDoc;
            return { currentUser: currentUser.toObject(), targetUser: targetUser.toObject() };
        },
        unfollow: async (parent, { targetUserId }, { token }) => {
            const { id } = verifyJWT(token);
            let currentUser = await findUserById(id);
            let targetUser = await findUserById(targetUserId);
            const { currentUserDoc, targetUserDoc } = await unfollowUser(currentUser, targetUser);
            currentUser = currentUserDoc;
            targetUser = targetUserDoc;
            return { currentUser: currentUser.toObject(), targetUser: targetUser.toObject() };
        },
    },
};

module.exports = { Mutation };
