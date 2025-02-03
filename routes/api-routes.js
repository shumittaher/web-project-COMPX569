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

router.post("/showArticles", async function (req, res) {

    const {filters} = req.body;
    const {sorts} = req.body;

    let currentUserID = null
    if (req.session.user != null) {
        currentUserID = req.session.user.id
    }

    if (filters.filterByUser) {
        filters.filterUserId = req.session.user.id;
    }

    try {
        const articles = await articlesDao.getArticles(filters, sorts);

        const articlesWithUserID = articles.map(article => {
            return {
                ...article,
                userLoggedIn: currentUserID,
                isAuthor: article.userid === currentUserID
            };
        });

        res.render("partials/articles", { articlesWithUserID , layout:false}, function (err, renderedArticles) {
            if (err) {
                console.error("Error rendering articles partial:", err);
                return res.status(500).send("Error rendering articles");
            }
            res.send(renderedArticles);
        });

    } catch (error) {
        res.status(500).json({ error: "Failed to fetch articles" });
    }
})

router.get("/getUserLikeStatus/:articleId/:userId", async function (req, res) {
    const { articleId, userId } = req.params;

    if (!articleId || !userId) {
        return res.status(400).json({ error: "Missing articleId or userId" });
    }

    try {
        const userLikedThis = await articlesDao.getUserLikesArticle(articleId, userId);
        res.json({ userLikedThis: userLikedThis });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }

})

router.put("/toggleLike/:articleId/:userId", async function (req, res) {
    const { articleId, userId } = req.params;
    if (!articleId || !userId) {
        return res.status(400).json({ error: "Missing articleId or userId" });
    }

    try {
        const userLikedThis = await articlesDao.getUserLikesArticle(articleId, userId);

        if (!userLikedThis) {
            await articlesDao.setUserLikesArticle(articleId, userId);
        } else {
            await articlesDao.deleteUserLike(articleId, userId);
        }

        res.json({ liked: !userLikedThis });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
})

router.get('/article/:articleId', async function (req, res) {
    const { articleId } = req.params;

    const result = await articlesDao.getArticleById(articleId)

    res.json(result);

})

module.exports = router;
