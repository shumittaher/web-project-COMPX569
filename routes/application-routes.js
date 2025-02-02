const express = require("express");
const router = express.Router();

const messagesDao = require("../modules/posts-dao.js");
const {locals} = require("express/lib/application");
const {response} = require("express");
const middleware = require("../middleware/auth.js");


router.get("/", function (req, res){
    res.redirect("/home");
});

router.get("/home", function (req, res) {
    res.locals.user = req.session.user
    res.render("home");
});

router.post("/new", middleware.verifyAuthenticated, function (req, res) {
    const {title, content, image} = req.body;
    messagesDao.postnew()

})

module.exports = router;

