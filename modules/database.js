const mariadb = require("mariadb");

const USER_NAME = process.env.USER_NAME;
const USER_PASS = process.env.USER_PASS;
const HOST = process.env.HOST;

const database = mariadb.createConnection({
    host: HOST,
    database: USER_NAME,
    user: USER_NAME,
    password: USER_PASS
});

module.exports = database;
