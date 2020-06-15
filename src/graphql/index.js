const { ApolloServer, makeExecutableSchema } = require('apollo-server-express');
const { typeDefs: gqlsTypeDefs, resolvers: gqlsResolvers } = require('graphql-scalars');
const { typeDefs } = require('./typeDefs');
const { resolvers } = require('./resolvers');

const mountGraphQL = (app) => {
    const server = new ApolloServer({
        schema: makeExecutableSchema({
            typeDefs: [...gqlsTypeDefs, typeDefs],
            resolvers: {
                ...gqlsResolvers,
                ...resolvers,
            },
        }),
        context: ({ req }) => {
            const token = req.headers.authorization || '';
            return { token };
        },
    });

    server.applyMiddleware({ app });

    return { app, server };
};

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

module.exports = { mountGraphQL, createTestServer };
