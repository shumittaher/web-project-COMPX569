const database = require("./database.js");
const bcrypt = require('bcrypt');


async function getUserByUsername(username) {
    const db = await database;
    const result = await db.query("SELECT * FROM project_users WHERE username = ?", [username]);
    return result[0];
}

async function getUserByUserId(userId) {
    const db = await database;
    const result = await db.query("SELECT * FROM project_users WHERE id = ?", [userId]);
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

async function editUser(userData, userId) {
    const {username, fullName, password, dob, description, avatar} = userData
    const hashedPassword = await hashPassword(password);

    const db = await database;

    return await db.query(
        "UPDATE project_users SET username = ?, fullName = ?, password = ?, dob = ?, description = ?, avatar = ? WHERE id = ?",
        [username, fullName, hashedPassword, dob, description, avatar, userId]
    );
}

async function deleteUser(userId) {
    const db = await database;
    return await db.query("DELETE FROM project_users WHERE id = ?", [userId]);
}

async function getUserByFirebaseUid(firebaseUid) {
    const db = await database;
    const result = await db.query("SELECT * FROM project_users WHERE firebase_uid = ?", [firebaseUid]);
    return result[0];
}

async function createUserFromFirebase(firebaseUid, email, fullName) {
    const db = await database;
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 32) + "_" + Date.now().toString().slice(-4);
    const result = await db.query(
        "INSERT INTO project_users (username, fullName, avatar, firebase_uid) VALUES (?, ?, ?, ?)",
        [username, fullName || email, "0.jpg", firebaseUid]
    );
    return { id: Number(result.insertId), username, fullName: fullName || email, avatar: "0.jpg", firebase_uid: firebaseUid };
}

module.exports = {
    getUserByUsername,
    createUser,
    verifyPassword,
    editUser,
    getUserByUserId,
    deleteUser,
    getUserByFirebaseUid,
    createUserFromFirebase,
}