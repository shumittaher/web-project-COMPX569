const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth.js");


router.get("/", function (req, res){
    res.redirect("/home");
});

router.get("/home", function (req, res) {
    res.locals.user = req.session.user
    res.render("home");
});

module.exports = router;

