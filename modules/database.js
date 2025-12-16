const mariadb = require("mariadb");

const USER_NAME = process.env.USER_NAME;
const USER_PASS = process.env.USER_PASS;
const HOST = process.env.HOST;
const DB_NAME = process.env.DB_NAME;
const PORT = process.env.DB_PORT || 3306;

console.log("DB CONFIG:", {
  host: process.env.HOST,
  port: process.env.DB_PORT,
  db: process.env.DB_NAME,
  user: process.env.USER_NAME,
});

const database = mariadb.createPool({
    host: HOST,
    database: DB_NAME,
    port: PORT,
    user: USER_NAME,
    password: USER_PASS,
    connectionLimit: 10,
    idleTimeout: 60000,
    acquireTimeout: 10000,
});

module.exports = database;
