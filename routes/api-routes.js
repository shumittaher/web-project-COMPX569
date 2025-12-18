const express = require("express");
const router = express.Router();

const middleware = require("../middleware/auth");
const articlesDao = require("../modules/articles-dao");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const upload = multer({
  dest: path.join(__dirname, "..", "temp"),
});
const { Jimp } = require("jimp");

const uploadImage = async (fileInfo) => {
  try {
    let image = await Jimp.read(fileInfo.path);
    // Only shrink if wider than 650px
    if (image.bitmap.width > 650) {
      image.resize({ w: 650 });
    }

    const mime = image.mime;

    // This is the real encoded image file bytes
    const buffer = await image.getBuffer(mime);

    const imageId = await articlesDao.createImage({
      mime_type: mime,
      original_filename: fileInfo.originalname,
      byte_size: buffer.length,
      width: image.bitmap.width,
      height: image.bitmap.height,
      image_data: buffer,
    });

    return imageId;
  } catch (err) {
    console.error(err);
    return null;
  }
};

const deleteImageByPath = (fullPath) => {
  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    } else {
      console.log("File deleted successfully");
    }
  });
}

router.post(
  "/new",
  middleware.verifyAuthenticated,
  upload.single("imageFile"),
  async function (req, res) {
    const { title, content } = req.body;
    const userid = req.session.user.id;
    let image_id = null;
    if (req.file) {
      image_id = await uploadImage(req.file);
      deleteImageByPath(req.file.path);
    }
    const result = await articlesDao.postNew({
      userid,
      title,
      content,
      image_id,
    });

    res.redirect("/home");
  }
);

router.post("/showArticles", async function (req, res) {
  const { filters } = req.body;
  const { sorts } = req.body;

  if (filters.filterByUser) {
    filters.filterUserId = req.session.user.id;
  }

  try {
    const articles = await articlesDao.getArticles(filters, sorts);

    const articlesWithUserID = insertInformation(req, articles);

    res.render(
      "partials/articles",
      { articlesWithUserID, layout: false },
      function (err, renderedArticles) {
        if (err) {
          console.error("Error rendering articles partial:", err);
          return res.status(500).send("Error rendering articles");
        }
        res.send(renderedArticles);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch articles" });
  }
});

router.get("/getUserLikeStatus/:articleId/:userId", async function (req, res) {
  const { articleId, userId } = req.params;

  if (!articleId || !userId) {
    return res.status(400).json({ error: "Missing articleId or userId" });
  }

  try {
    const userLikedThis = await articlesDao.getUserLikesArticle(
      articleId,
      userId
    );
    res.json({ userLikedThis: userLikedThis });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.put("/toggleLike/:articleId/:userId", async function (req, res) {
  const { articleId, userId } = req.params;
  if (!articleId || !userId) {
    return res.status(400).json({ error: "Missing articleId or userId" });
  }

  try {
    const userLikedThis = await articlesDao.getUserLikesArticle(
      articleId,
      userId
    );

    if (!userLikedThis) {
      await articlesDao.setUserLikesArticle(articleId, userId);
    } else {
      await articlesDao.deleteUserLike(articleId, userId);
    }

    res.json({ liked: !userLikedThis });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/article/:articleId", async function (req, res) {
  const { articleId } = req.params;

  const result = await articlesDao.getArticleById(articleId);

  res.json(result);
});

router.post("/edit", 
  middleware.verifyAuthenticated, 
  upload.single("imageFile"), 
  async function (req, res) {
  const { title, content, article_id, keepImage } = req.body;
  const currentUser = req.session.user.id;

  if (!(await checkAuthorityAsAuthor(req, article_id))) {

    return res.status(400).json({ error: "Unauthorized" });
  
  } else {

    let imageUpdate = false;
    let image_id = null;

    if (!keepImage) {  //if the user does not want to keep the existing image
      if (req.file) { //file given, replace existing image with new one
        imageUpdate = true;
        image_id = await uploadImage(req.file);
        deleteImageByPath(req.file.path);
      } else { //no file given, remove existing image
        imageUpdate = true;
        await deleteImage(article_id);
      }
    }

    const updated = await articlesDao.updateArticle(
      article_id,
      currentUser,
      title,
      content,
      image_id,
      imageUpdate
    );

    if (updated) {
      res.redirect(`/home`);
    } else {
      res.status(403).json({ success: false, message: "Permission denied" });
    }
  }
});

router.post(
  "/comment",
  middleware.verifyAuthenticated,
  async function (req, res) {
    const { parent_id, commentContent, anc_id } = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNewComment({
      userid,
      commentContent,
      parent_id,
      anc_id,
    });

    res.redirect("/home");
  }
);

router.post(
  "/commentOnComment",
  middleware.verifyAuthenticated,
  async function (req, res) {
    const { parent_id, commentContent, anc_id } = req.body;
    const userid = req.session.user.id;
    const result = await articlesDao.postNewCommentOnOtherComment({
      userid,
      commentContent,
      parent_id,
      anc_id,
    });

    res.redirect("/home");
  }
);

router.get("/comment/:articleId", async function (req, res) {
  const { articleId } = req.params;
  const comments = await articlesDao.getCommentsOnArticle(articleId);

  if (comments.length < 1) {
    res.send(false);
  } else {
    const commentsWithInfo = insertInformation(req, comments);
    const commentsWithUserID = insertAncInformation(req, commentsWithInfo);

    res.render(
      "partials/comments",
      { commentsWithUserID, layout: false },
      function (err, renderedArticles) {
        if (err) {
          console.error("Error rendering articles partial:", err);
          return res.status(500).send("Error rendering comments");
        }
        res.send(renderedArticles);
      }
    );
  }
});

router.get("/commentOnComment/:parentCommentID", async function (req, res) {
  const { parentCommentID } = req.params;
  const comments = await articlesDao.getCommentsOnOtherComment(parentCommentID);

  if (comments.length < 1) {
    res.send(false);
  } else {
    const commentsWithInfo = insertInformation(req, comments);
    const commentsWithUserID = insertAncInformation(req, commentsWithInfo);

    res.render(
      "partials/comments",
      { commentsWithUserID, layout: false },
      function (err, renderedArticles) {
        if (err) {
          console.error("Error rendering articles partial:", err);
          return res.status(500).send("Error rendering comments");
        }
        res.send(renderedArticles);
      }
    );
  }
});

router.get("/deleteArticle/:articleId", async function (req, res) {
  const { articleId } = req.params;
  if (!(await checkAuthorityAsAuthor(req, articleId))) {
    res.status(403).json({ success: false, message: "Permission denied" });
  } else {
    await deleteImage(articleId);
    const updated = await articlesDao.deleteArticle(articleId);
    if (updated) {
      return res.status(200).send("Success");
    } else {
      return res.status(500).send("Error");
    }
  }
});

router.get("/deleteComment/:commentId", async function (req, res) {
  const { commentId } = req.params;
  if (false) {
    res.status(403).json({ success: false, message: "Permission denied" });
  } else {
    const updated = await articlesDao.deleteComment(commentId);
    if (updated) {
      return res.status(200).send("Success");
    } else {
      return res.status(500).send("Error");
    }
  }
});

function insertInformation(req, articles) {
  return articles.map((article) => {
    let currentUserID = null;
    if (req.session.user != null) {
      currentUserID = req.session.user.id;
    }
    return {
      ...article,
      userLoggedIn: currentUserID,
      isAuthor: article.userid === currentUserID,
    };
  });
}

function insertAncInformation(req, comments) {
  return comments.map((comment) => {
    let currentUserID = null;
    if (req.session.user != null) {
      currentUserID = req.session.user.id;
    }
    return {
      ...comment,
      isAncestor: comment.ancestorUserID === currentUserID,
      isAuthorizedToDelete:
        comment.ancestorUserID === currentUserID || comment.isAuthor,
    };
  });
}

async function checkAuthorityAsAuthor(req, article_id) {
  const currentUser = req.session.user.id;
  const underlyingArticle = await articlesDao.getArticleById(article_id);

  return underlyingArticle.userid === currentUser;
}

async function deleteImage(article_id) {
  const underlyingArticle = await articlesDao.getArticleById(article_id);
  if (!underlyingArticle.image_id) {
    return;
  }
  articlesDao.deleteImageById(underlyingArticle.image_id);
}

router.get("/getLikeCount/:article_id", async function (req, res) {
  try {
    const article_id = req.params.article_id;
    const likeCount = await articlesDao.getLikeCounts(article_id);
    res.json({ like_count: Number(likeCount) });
  } catch (error) {
    console.error("Error fetching like count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/images/:imageId", async (req, res) => {
  try {
    const imageId = Number(req.params.imageId);
    if (!Number.isFinite(imageId)) return res.status(400).send("Bad image id");

    const img = await articlesDao.getImageById(imageId);
    if (!img) return res.status(404).send("Not found");

    res.setHeader("Content-Type", img.mime_type);
    return res.send(img.image_data); // sends Buffer
  } catch (err) {
    console.error(err);
    return res.status(500).send("Server error");
  }
});

module.exports = router;
