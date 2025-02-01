const express = require("express");
const router = express.Router();

const userDao = require("../modules/users-dao.js");
const {response} = require("express");


router.get("/logout", function (req, res) {
    if (req.session.user) {
        delete req.session.user;
        res.redirect("login?message=Successfully logged out!");
    }
    res.redirect("login?message=You are already logged out!");
})

router.get("/login", async function (req, res) {
    res.locals.message = req.query.message;
    res.render("account/login");
})

router.post("/login", async function (req, res) {

    const {username, password } = req.body
    const user = await userDao.retrieveUserWithCredentials(username, password)

    if (user) {
        req.session.user = user;
        res.redirect("/");
    } else {
        res.redirect("login?message=Authentication failed!");
    }

})

router.get("/checkUserName", async function (req, res) {
    const checkName = req.query.username
    const checkedName = await userDao.getUserByUsername(checkName)

    if (checkedName) {
        res.json({ available: false, message: "Username is already taken" });
    } else {
        res.json({ available: true, message: "Username is available" });
    }
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

module.exports = router;