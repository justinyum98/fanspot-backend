import logger from './logger';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.test')) {
    logger.debug('Using .env.test file to supply config environment variables');
    dotenv.config({ path: '.env.test' });
}

export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === 'production'; // Anything else is treated as 'test'
const test = ENVIRONMENT === 'test';

export const MONGODB_URI = prod ? process.env['MONGODB_URI'] : process.env['MONGODB_URI_TEST'];

export const REDIS_URL = prod ? process.env['REDIS_URL'] : process.env['REDIS_URL_TEST'];

if (!MONGODB_URI) {
    if (prod) {
        logger.error('No mongo connection string. Set MONGODB_URI environment variable.');
    } else if (test) {
        logger.error('No mongo connection string. Set MONGODB_URI_TEST environment variable.');
    } else {
        logger.error('No mongo connection string. Neither in prod or test environment.');
    }
    process.exit(1);
}

if (!REDIS_URL) {
    if (prod) {
        logger.error('No redis connection string. Set REDIS_URL environment variable.');
    } else if (test) {
        logger.error('No redis connection string. Set REDIS_URL_TEST environment variable.');
    } else {
        logger.error('No redis connection string. Neither in prod or test environment.');
    }
    process.exit(1);
}
