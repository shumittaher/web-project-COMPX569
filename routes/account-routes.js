const express = require("express");
const router = express.Router();

const userDao = require("../modules/users-dao.js");
const {response} = require("express");

router.get("/login", async function (req, res) {
    await userDao.testDBConnection()
    res.render("account/login");
})

router.get("/create", async function (req, res) {

    res.render("account/create");

})
router.post("/create", async function (req, res) {
    const {username, password, name} = req.body
    try {
        const daoResponse = await userDao.createUser({username, password, name});
    } catch (SqlError){

    }

})

router.post("/register", async function (req, res) {

})

module.exports = router;