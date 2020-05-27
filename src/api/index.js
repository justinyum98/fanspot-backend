const auth = require('./auth');

const mountAllRoutes = (app) => {
    app.use('/auth', auth);

    return app;
};

module.exports = { mountAllRoutes };
