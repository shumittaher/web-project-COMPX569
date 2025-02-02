const express = require("express");
const router = express.Router();

const userDao = require("../modules/users-dao.js");
const {response} = require("express");
const {createUser} = require("../modules/users-dao");
const middleware = require("../middleware/auth.js");


router.get("/logout", function (req, res) {
    if (req.session.user) {
        delete req.session.user;
        res.redirect("login?message=Successfully logged out!");
    } else {
        res.redirect("login?message=You are already logged out!");
    }
})

router.get("/login", async function (req, res) {
    res.locals.message = req.query.message;
    res.render("account/login");
})

router.post("/login", async function (req, res) {

    const {username, password } = req.body
    const user = await userDao.getUserByUsername(username)
    if (!user) {
        res.redirect("login?message=Authentication failed!");
    } else {
        const isMatch = await userDao.verifyPassword(password, user.password);
        if (isMatch) {
            req.session.user = user;
            res.redirect("/");
        } else {
            res.redirect("login?message=Authentication failed!");
        }
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

    let avatars = getAvatars()

    res.locals.message = req.query.message;
    res.locals.isEdit = false;

    res.render("account/user_form", {avatars:avatars});
})
router.post("/create", async function (req, res) {
    const {username, fullName, password, dob, description, avatar} = req.body
    const user = {username, fullName, password, dob, description, avatar}

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

router.get("/edit", middleware.verifyAuthenticated, async function (req, res) {
    let avatars = getAvatars()

    res.locals.message = req.query.message;
    res.locals.isEdit = true;
    res.locals.user = req.session.user

    res.render("account/user_form", {avatars:avatars});
})

router.post("/edit", middleware.verifyAuthenticated, async function (req, res) {
    const {username, fullName, password, dob, description, avatar} = req.body
    const user = await userDao.getUserByUserId(req.session.user.id);

    const daoResponse = await userDao.editUser({username, fullName, password, dob, description, avatar}, user.id)

    if (daoResponse.affectedRows > 0) {
        req.session.user = await userDao.getUserByUserId(user.id)
        res.locals.message = "Edit Successful"
    } else {
        res.locals.message = "Edit Failed"
    }
    res.redirect("/");
})

router.delete("/delete", middleware.verifyAuthenticated, async function (req, res) {

    if (req.session.user === null) {
        console.log("hit")

        res.redirect("login?message=Please log in!");
    }

    try {
        const response = await userDao.deleteUser(req.session.user.id)

        if (response.affectedRows > 0) {
            req.session.destroy();
            res.redirect("/");
        } else {
            res.redirect("edit?message=Account not found!");
        }
    } catch (error) {
        res.redirect("edit?message=Error Deleting the user!");
    }
})

function getAvatars() {
    let avatars = []
    for (i = 0; i < 14; i++) {
        avatars[i] = `${i}.jpg`
    }
    return avatars;
}

module.exports = router;