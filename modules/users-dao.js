const database = require("./database.js");


async function getUserByUsername(username) {
    const db = await database;
    const result = await db.query("SELECT * FROM project_users WHERE username = ?", [username]);
    return result[0];
}

async function retrieveUserWithCredentials(username, password){
    const db = await database;

    const user = await db.query(
        "select * from project_users where username = ? and password = ?",
        [username, password]);

    return user[0];
}


async function createUser(user) {
    const db = await database;

    const {username, fullName, password, dob, description} = user

    const result = await db.query(

        "insert into project_users (username, fullName, password, dob, description) values (?, ?, ?, ?, ?)",
        [username, fullName, password, dob, description]);

    // Get the auto-generated ID value, and assign it back to the user object.
    user.id = result.insertId;

    return user;
}

module.exports = {
    getUserByUsername,
    createUser,
}