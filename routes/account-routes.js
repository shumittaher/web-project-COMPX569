const express = require("express");
const router = express.Router();

const userDao = require("../modules/users-dao.js");
const {response} = require("express");

router.get("/checkUserName", async function (req, res) {
    const checkName = req.query.username
    const checkedName = await userDao.getUserByUsername(checkName)

    if (checkedName) {
        res.json({ available: false, message: "Username is already taken" });
    } else {
        res.json({ available: true, message: "Username is available" });
    }
})

router.get("/login", async function (req, res) {
    res.locals.message = req.query.message;
    res.render("account/login");
})

router.get("/create", async function (req, res) {

    res.locals.message = req.query.message;
    res.render("account/create");

})
router.post("/create", async function (req, res) {
    const {username, fullName, password, dob, description} = req.body
    const user = {username, fullName, password, dob, description}

    try {
        const daoResponse = await userDao.createUser(user);
        if (daoResponse) {
            res.redirect("login?message=Account created successfully!");
        }
        else {
            res.redirect("create?message=Account validation failed!");
        }
    } catch (SqlError){
        res.redirect("create?message=Account validation failed!");

    }

})

router.post("/register", async function (req, res) {

})

module.exports = router;