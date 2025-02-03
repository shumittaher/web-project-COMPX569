const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const articlesDao = require("../modules/articles-dao");


router.post("/new", middleware.verifyAuthenticated, async function (req, res) {

    const {title, content, image_path} = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNew({userid, title, content, image_path})

    res.redirect("/home");
})

router.get("/showArticles", async function (req, res) {

    const results = await articlesDao.getArticles()
    console.log("results"+results)

})

module.exports = router;
