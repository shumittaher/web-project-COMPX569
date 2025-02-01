const express = require("express");
const router = express.Router();

const userDao = require("../modules/users-dao.js");
const {response} = require("express");

router.get("/login", async function (req, res) {
    await userDao.testDBConnection()
    res.render("account/login");
})


module.exports = router;