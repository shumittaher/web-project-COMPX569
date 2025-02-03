const mariadb = require("mariadb");

const USER_NAME = process.env.USER_NAME;
const USER_PASS = process.env.USER_PASS;
const HOST = process.env.HOST;

const database = mariadb.createPool({
    host: HOST,
    database: USER_NAME,
    user: USER_NAME,
    password: USER_PASS,
    connectionLimit: 10,
    idleTimeout: 600000,
    acquireTimeout: 30000,
});

module.exports = database;
