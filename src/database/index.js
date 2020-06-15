const mongoose = require('mongoose');

const connectDatabase = async () => {
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });

    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        console.log('successfully connected to database');
    });
};

const connectTestDatabase = async () => {
    await mongoose.connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });
    const { connection } = mongoose;
    return connection;
};

const closeTestDatabase = async (connection) => {
    return new Promise((resolve, reject) => {
        connection.close((err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

module.exports = {
    connectDatabase,
    connectTestDatabase,
    closeTestDatabase,
};
