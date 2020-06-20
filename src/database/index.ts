import mongoose = require('mongoose');
import { MONGODB_URI } from '../utils/secrets';

export async function connectDatabase(): Promise<mongoose.Connection> {
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    });

    const { connection } = mongoose;
    return connection;
}

export async function closeDatabase(connection: mongoose.Connection): Promise<string> {
    return new Promise((resolve, reject) => {
        connection.close((err) => {
            if (err) return reject(err);
            return resolve('OK');
        });
    });
}
