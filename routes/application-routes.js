const express = require("express");
const router = express.Router();

const messagesDao = require("../modules/messages-dao.js");
const {locals} = require("express/lib/application");
const {response} = require("express");

router.get("/", function (req, res){
    res.redirect("/home");
});

router.get("/home", function (req, res) {

    res.render("home");

});

module.exports = router;

