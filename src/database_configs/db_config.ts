import 'dotenv/config';

module.exports = {
    production: {
        host: process.env.PROD_DB_HOST,
        port: parseInt(process.env.PROD_DB_PORT),
        database: process.env.PROD_DB_NAME,
        username: process.env.PROD_DB_USER,
        password: process.env.PROD_DB_PASS,
        dialect: "mysql",
    },
    test: {
        host: process.env.TEST_DB_HOST,
        port: parseInt(process.env.TEST_DB_PORT),
        database: process.env.TEST_DB_NAME,
        username: process.env.TEST_DB_USER,
        password: process.env.TEST_DB_PASS,
        dialect: "mysql",
    },
    development: {
        host: process.env.DEV_DB_HOST,
        port: parseInt(process.env.DEV_DB_PORT),
        database: process.env.DEV_DB_NAME,
        username: process.env.DEV_DB_USER,
        password: process.env.DEV_DB_PASS,
        dialect: "mysql",
    },
};