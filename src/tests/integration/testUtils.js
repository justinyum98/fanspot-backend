const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const { typeDefs: gqlsTypeDefs, resolvers: gqlsResolvers } = require('graphql-scalars');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { typeDefs } = require('../../graphql/typeDefs');
const { resolvers } = require('../../graphql/resolvers');

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

const verifyTestingJWT = (token) => {
    const { id, username } = jwt.verify(token, process.env.JWT_SECRET);
    return { id, username };
};

module.exports = {
    createTestServer,
    connectTestDatabase,
    generateTestingJWT,
    verifyTestingJWT,
};
