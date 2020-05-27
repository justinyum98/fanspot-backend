const express = require('express');
const { mountAllRoutes } = require('./src/api/index');

const PORT = process.env.PORT || 5000;

const app = express();
mountAllRoutes(app);

app.listen(PORT, () => console.log(`Listening on ${PORT}`));
