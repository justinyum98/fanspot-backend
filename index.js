const express = require('express');
const { connectDatabase } = require('./src/database');
const { mountMiddleware } = require('./src/middleware');
const { mountGraphQL } = require('./src/graphql');

const PORT = process.env.PORT || 5000;

const app = express();
connectDatabase();
mountMiddleware(app);
const { server } = mountGraphQL(app);

app.listen(PORT, () => {
    console.log(`Listening on ${PORT}`);
    console.log(`GraphQL server ready at ${server.graphqlPath}`);
});
