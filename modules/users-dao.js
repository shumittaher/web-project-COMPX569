const database = require("./database.js");

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
    createUser,
}