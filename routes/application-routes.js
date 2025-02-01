const express = require("express");
const router = express.Router();

const messagesDao = require("../modules/posts-dao.js");
const {locals} = require("express/lib/application");
const {response} = require("express");

router.get("/", function (req, res){
    res.redirect("/home");
});

router.get("/home", function (req, res) {
    res.locals.user = req.session.user

    res.render("home", {message: "Welcome to the application!"});

});

module.exports = router;

