require("dotenv").config();

module.exports = {
    development: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        dialect: "mysql",
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASS
    },
    production: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT),
        dialect: "mysql",
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASS
    }
}