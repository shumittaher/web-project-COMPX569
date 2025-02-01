const database = require("./database.js");

async function testDBConnection() {
    const db = await database;
    console.log("db connection ok");
}

module.exports = {
    testDBConnection,
}