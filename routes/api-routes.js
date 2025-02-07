const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const articlesDao = require("../modules/articles-dao");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const upload = multer({
    dest: path.join(__dirname, "..","temp")
});
const {Jimp} = require("jimp");


router.post("/uploadImage", upload.single("imageFile"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const fileInfo = req.file;
    const oldFileName = fileInfo.path;

    let image = await Jimp.read(`${oldFileName}`);
    image.resize({ w: 650 });
    await image.write(`./public/uploadedFiles/${fileInfo.originalname}`);
    deleteImageByPath(oldFileName);
    res.status(200)
})

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

    let imageUpdate = true
    if (image_path===""){
        imageUpdate = false
    } else{
        await deleteImage(article_id)
    }

    if (!await checkAuthorityAsAuthor(req, article_id)){
        return res.status(400).json({ error: "Unauthorized" });
    } else {
        const updated = await articlesDao.updateArticle(article_id, currentUser, title, content, image_path, imageUpdate)
        if (updated) {
            res.redirect(`/home`);
        } else {
            res.status(403).json({ success: false, message: "Permission denied" });
        }
    }

})

router.post("/comment", middleware.verifyAuthenticated, async function (req, res) {

    const {parent_id, commentContent, anc_id} = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNewComment({userid, commentContent, parent_id, anc_id})

    res.redirect("/home");
})

router.post("/commentOnComment", middleware.verifyAuthenticated, async function (req, res) {

    const {parent_id, commentContent, anc_id} = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNewCommentOnOtherComment({userid, commentContent, parent_id, anc_id})

    res.redirect("/home");
})

router.get("/comment/:articleId", async function (req, res) {
    const { articleId } = req.params;
    const comments = await articlesDao.getCommentsOnArticle(articleId)

    if (comments.length < 1) {
        res.send(false)
    } else {
        const commentsWithInfo = insertInformation(req, comments)
        const commentsWithUserID = insertAncInformation(req, commentsWithInfo)

        res.render("partials/comments", {commentsWithUserID, layout: false}, function (err, renderedArticles) {
            if (err) {
                console.error("Error rendering articles partial:", err);
                return res.status(500).send("Error rendering comments");
            }
            res.send(renderedArticles);
        });
    }
})

router.get("/commentOnComment/:parentCommentID", async function (req, res) {
    const { parentCommentID } = req.params;
    const comments = await articlesDao.getCommentsOnOtherComment(parentCommentID)

    if (comments.length < 1) {
        res.send(false)
    } else {
        const commentsWithInfo = insertInformation(req, comments)
        const commentsWithUserID = insertAncInformation(req, commentsWithInfo)

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
        res.status(403).json({ success: false, message: "Permission denied" });
    } else {
        await deleteImage(articleId)
        const updated = await articlesDao.deleteArticle(articleId)
        if (updated) {
            return res.status(200).send("Success");
        } else {
            return res.status(500).send("Error");
        }
    }
})

router.get("/deleteComment/:commentId", async function (req, res) {

    const { commentId } = req.params;
    if (false){
        res.status(403).json({ success: false, message: "Permission denied" });
    } else {
        const updated = await articlesDao.deleteComment(commentId)
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
        return {
            ...article,
            userLoggedIn: currentUserID,
            isAuthor: article.userid === currentUserID
        };
    });
}

function insertAncInformation(req, comments){
    return comments.map(comment => {
        let currentUserID = null
        if (req.session.user != null) {
            currentUserID = req.session.user.id
        }
        return {
            ...comment,
            isAncestor: comment.ancestorUserID === currentUserID,
            isAuthorizedToDelete: comment.ancestorUserID === currentUserID || comment.isAuthor,
        };
    });
}


async function checkAuthorityAsAuthor(req, article_id) {
    const currentUser = req.session.user.id;
    const underlyingArticle = await articlesDao.getArticleById(article_id)

    return underlyingArticle.userid === currentUser;
}

async function deleteImage(article_id) {
    const underlyingArticle = await articlesDao.getArticleById(article_id)
    if (underlyingArticle.image_path === "" || underlyingArticle.image_path === null) {
        return
    }
    const fullPath = path.join(__dirname, '..', 'public', 'uploadedFiles', underlyingArticle.image_path);
    deleteImageByPath(fullPath)
}

function deleteImageByPath(fullPath) {

    fs.unlink(fullPath, (err) => {
        if (err) {
            console.error("Error deleting file:", err);
        } else {
            console.log("File deleted successfully");
        }
    });
}

router.get("/getLikeCount/:article_id", async function (req, res) {
    try {
        const article_id = req.params.article_id
        const likeCount = await articlesDao.getLikeCounts(article_id);
        res.json({ article_id, like_count: likeCount });
    } catch (error) {
        console.error("Error fetching like count:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
})

module.exports = router;
