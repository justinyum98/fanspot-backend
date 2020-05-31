const _ = require('lodash');
const { AuthenticationError } = require('apollo-server-express');
const {
    findUserByUsername,
    findUserByEmail,
    createUser,
} = require('../../database/dataAccess/User');
const { generateJWT } = require('../../jwt');

const resolvers = {
    Query: {
        sayHello: () => 'hello',
    },
    Mutation: {
        login: async (parent, { username, password }, context) => {
            // (1) Check if user with username exists
            const user = await findUserByUsername({ username });
            if (!user) {
                throw new AuthenticationError('User with username does not exist.');
            }
            // (2) Check if provided credentials match
            if (!(_.isEqual(username, user.username) && _.isEqual(password, user.password))) {
                throw new AuthenticationError('Username and/or password is incorrect.');
            }
            // (3) Generate JWT
            const token = generateJWT(user.id, user.username);
            // (4) Return user and JWT
            return { user, token };
        },
        register: async (parent, { username, password, email }, context) => {
            // (1) Check if username is taken
            let user = await findUserByUsername({ username });
            if (user) {
                throw new AuthenticationError('Username is taken.');
            }
            // (2) Check if email is taken
            user = await findUserByEmail({ email });
            if (user) {
                throw new AuthenticationError('Email is taken.');
            }
            // (3) Create new user
            const newUser = await createUser({ username, password, email });
            // (4) Generate JWT
            const token = generateJWT(newUser.id, newUser.username);
            // (5) Return user and JWT
            return { user: newUser, token };
        },
    },
};

module.exports = resolvers;
