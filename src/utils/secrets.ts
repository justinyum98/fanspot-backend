import logger from './logger';
import dotenv from 'dotenv';
import fs from 'fs';

export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === 'production';
const dev = ENVIRONMENT === 'dev';
const test = ENVIRONMENT === 'test';

if (!prod) {
    if (dev && fs.existsSync('.env.dev')) {
        logger.debug('Dev environment: Loading .env.dev file for env variables');
        dotenv.config({ path: '.env.dev' });
    } else if (test && fs.existsSync('.env.test')) {
        logger.debug('Test environment: Loading .env.test file for env variables');
        dotenv.config({ path: '.env.test' });
    } else {
        logger.error('Error loading environment variables.');
        process.exit(1);
    }
}

export const MONGODB_URI = process.env['MONGODB_URI'];

if (!MONGODB_URI) {
    logger.error('No mongo connection string. Set MONGODB_URI environment variable.');
    process.exit(1);
}
