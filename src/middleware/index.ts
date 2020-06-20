import express = require('express');

export function mountMiddleware(app: express.Express): express.Express {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    return app;
}
