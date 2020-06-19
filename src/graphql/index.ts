import express = require('express');
import { ApolloServer, makeExecutableSchema } from 'apollo-server-express';
import { typeDefs as gqlsTypeDefs, resolvers as gqlsResolvers } from 'graphql-scalars';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';

export function mountGraphQL(app: express.Express): { app: express.Express; server: ApolloServer } {
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
        introspection: true,
        playground: true,
    });

    server.applyMiddleware({ app });

    return { app, server };
}

export function createTestServer(context = {}): ApolloServer {
    return new ApolloServer({
        schema: makeExecutableSchema({
            typeDefs: [...gqlsTypeDefs, typeDefs],
            resolvers: {
                ...gqlsResolvers,
                ...resolvers,
            },
        }),
        context: () => context,
    });
}
