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



    if (filters.filterByUser) {
        filters.filterUserId = req.session.user.id;
    }

    try {
        const articles = await articlesDao.getArticles(filters, sorts);

        const articlesWithUserID = insertInformation(req, articles)

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

router.post("/edit", middleware.verifyAuthenticated, async function (req, res) {

    const {title, content, image_path, article_id} = req.body;
    const currentUser = req.session.user.id;

    if (!await checkAuthorityAsAuthor(req, article_id)){
        return res.status(400).json({ error: "Unauthorized" });
    } else {
        const updated = await articlesDao.updateArticle(article_id, currentUser, title, content, image_path)
        if (updated) {
            res.redirect(`/home`);
        } else {
            res.status(403).json({ success: false, message: "Failed to update article. Permission denied or invalid article ID." });
        }
    }

})

router.post("/comment", middleware.verifyAuthenticated, async function (req, res) {

    const {parent_id, commentContent} = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNewComment({userid, commentContent, parent_id})

    res.redirect("/home");
})

router.get("/comment/:articleId", async function (req, res) {
    const { articleId } = req.params;
    const articles = await articlesDao.getCommentsOnArticle(articleId)

    if (articles.length < 1) {
        res.send(false)
    } else {
        const commentsWithUserID = insertInformation(req, articles)

        res.render("partials/comments", {commentsWithUserID, layout: false}, function (err, renderedArticles) {
            if (err) {
                console.error("Error rendering articles partial:", err);
                return res.status(500).send("Error rendering comments");
            }
            res.send(renderedArticles);
        });
    }
})

router.get("/deleteArticle/:articleId", async function (req, res) {

    const { articleId } = req.params;
    if (!await checkAuthorityAsAuthor(req, articleId)){
        res.status(403).json({ success: false, message: "Failed to update article. Permission denied or invalid article ID." });
    } else {
        const updated = await articlesDao.deleteArticle(articleId)
        if (updated) {
            return res.status(200).send("Success");
        } else {
            return res.status(500).send("Error");
        }
    }
})


function insertInformation(req, articles){
    return articles.map(article => {
        let currentUserID = null
        if (req.session.user != null) {
            currentUserID = req.session.user.id
        }
        console.log(article)
        return {
            ...article,
            userLoggedIn: currentUserID,
            isAuthor: article.userid === currentUserID
        };
    });
}

async function checkAuthorityAsAuthor(req, article_id) {
    const currentUser = req.session.user.id;
    const underlyingArticle = await articlesDao.getArticleById(article_id)

    return underlyingArticle.userid === currentUser;
}


module.exports = router;
