import express = require('express');
import { ApolloServer } from 'apollo-server-express';
import { connectDatabase } from './database';
import { mountMiddleware } from './middleware';
import { mountGraphQL } from './graphql';

const PORT = process.env.PORT || 5000;

const app: express.Express = express();
connectDatabase();
mountMiddleware(app);
const { server }: { app: express.Express; server: ApolloServer } = mountGraphQL(app);

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
    console.log(`GraphQL server ready at ${server.graphqlPath}`);
});
