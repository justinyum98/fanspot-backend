const express = require('express');

const mountMiddleware = (app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    return app;
};

module.exports = { mountMiddleware };
