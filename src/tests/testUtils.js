const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const { typeDefs: gqlsTypeDefs, resolvers: gqlsResolvers } = require('graphql-scalars');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { typeDefs } = require('../graphql/typeDefs');
const { resolvers } = require('../graphql/resolvers');
const { verifyJWT } = require('../jwt');
const { cacheUser, getCachedUser, closeRedis } = require('../redis/utils');

const createTestServer = (context = {}) =>
    new ApolloServer({
        schema: makeExecutableSchema({
            typeDefs: [...gqlsTypeDefs, typeDefs],
            resolvers: {
                ...gqlsResolvers,
                ...resolvers,
            },
        }),
        context: () => context,
    });

const connectTestDatabase = async () => {
    await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });
    const { connection } = mongoose;
    return connection;
};

const closeTestDatabase = async (connection) => {
    return new Promise((resolve, reject) => {
        connection.close((err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

const generateTestingJWT = (id, username) => {
    return jwt.sign(
        {
            id,
            username,
        },
        process.env.JWT_SECRET,
        {
            issuer: 'Test',
            expiresIn: '2h',
        }
    );
};

module.exports = {
    createTestServer,
    connectTestDatabase,
    closeTestDatabase,
    generateTestingJWT,
    verifyJWT,
    cacheUser,
    getCachedUser,
    closeRedis,
};
