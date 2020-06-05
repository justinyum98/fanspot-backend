module.exports = {
    mongodbMemoryServerOptions: {
        instance: {
            dbName: 'jest',
        },
        binary: {
            version: '4.0.3',
            checkMD5: false,
        },
        autoStart: false,
    },
};
