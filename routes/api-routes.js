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

    try {
        const articles = await articlesDao.getArticles();

        res.render("partials/articles", { articles , layout:false}, function (err, renderedArticles) {
            if (err) {
                console.error("Error rendering articles partial:", err);
                return res.status(500).send("Error rendering articles");
            }
            res.send(renderedArticles);
        });

    } catch (error) {
        console.error("Error fetching articles:", error);
        res.status(500).json({ error: "Failed to fetch articles" });
    }
})

module.exports = router;
