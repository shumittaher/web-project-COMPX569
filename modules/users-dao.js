const database = require("./database.js");
const bcrypt = require('bcrypt');


async function getUserByUsername(username) {
    const db = await database;
    const result = await db.query("SELECT * FROM project_users WHERE username = ?", [username]);
    return result[0];
}

async function createUser(user) {
    const db = await database;

    const {username, fullName, password, dob, description, avatar} = user
    const hashedPassword = await hashPassword(password)

    const result = await db.query(
        "insert into project_users (username, fullName, password, dob, description, avatar) values (?, ?, ?, ?, ?, ?)",
        [username, fullName, hashedPassword, dob, description, avatar]
    );

    user.id = result.insertId;

    return user;
}

async function hashPassword(plainTextPassword) {
    const saltRounds = 10;
    return await bcrypt.hash(plainTextPassword, saltRounds);
}
async function verifyPassword(inputPassword, storedHashedPassword) {
    return await bcrypt.compare(inputPassword, storedHashedPassword);
}


module.exports = {
    getUserByUsername,
    createUser,
    verifyPassword
}