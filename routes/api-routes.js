const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const messagesDao = require("../modules/posts-dao");


router.post("/new", middleware.verifyAuthenticated, async function (req, res) {

    const {title, content, image_path} = req.body;

    const userid = req.session.user.id;

    const result = await messagesDao.postNew({userid, title, content, image_path})

    res.redirect("/home");
})

router.get("/showArticles", function (req, res) {


})


module.exports = router;
