const database = require("./database.js");

async function postNew(articleData) {
    const db = await database;

    const {userid, title, content, image_path} = articleData;

    const article_insert_result = await db.query(
        "insert into project_articles (userid, title, content, image_path) values (?, ?, ?, ?)",
        [userid, title, content, image_path]
    );

    articleData.id = article_insert_result.insertId;
    return articleData;
}

async function postUpdate(articleNumber) {
    const db = await database;

    await db.query(`
        UPDATE project_articles
        SET parent_article_id = ?
        WHERE id = ?
    `, [articleNumber, articleNumber]);

}

async function getArticles(filters, sorts) {
    const db = await database;

    const { filterByUser, filterUserId } = filters
    const { sortSelectState, sortTypeState } = sorts;

    let query =
        `SELECT 
            project_articles.id AS article_id, 
            project_articles.title,
            project_articles.userid,
            project_articles.content, 
            project_articles.image_path, 
            project_articles.postTime, 
            project_users.username, 
            project_users.fullName, 
            project_users.avatar
        FROM project_articles  
        LEFT JOIN project_users ON project_articles.userid = project_users.id 
        LEFT JOIN project_article_likes ON project_articles.id = project_article_likes.article_id 

`

    if (filterByUser) {
        query += ` AND project_articles.userid = ${filterUserId} `;
    }

    if (sortSelectState !== '') {
        query += ` ORDER BY ${sortSelectState} ${sortTypeState} `;
    }

    return await db.query(
        query
    )
}

async function getUserLikesArticle(article_id, userid) {
    const db = await database;

    const results = await db.query(
        ` SELECT * 
                FROM project_article_likes 
                WHERE article_id = ? AND userid = ?
        `, [article_id, userid])

    return results.length > 0;

}

async function setUserLikesArticle(article_id, userid) {
    const db = await database;

    const result = await db.query(
        "insert into project_article_likes (article_id, userid) values (?, ?)",
        [article_id, userid]
    );

    return result.affectedRows > 0;
}

async function deleteUserLike(article_id, userid) {

    const db = await database;

    const result = await db.query(
        "DELETE FROM project_article_likes WHERE article_id = ? AND userid = ?",
        [article_id, userid]
    );

    return result.affectedRows > 0;
}

async function getArticleById(article_id) {
    const db = await database;
    const result = await db.query(
        "Select * from project_articles where id = ?", [article_id],
    )

    return result[0]
}

async function updateArticle(articleId, userId, title, content, imagePath) {
    const db = await database;

    const sql = `
        UPDATE project_articles
        SET title = ?, content = ?, image_path = ?, postTime = NOW()
        WHERE id = ? AND userid = ?
    `;

    const values = [title, content, imagePath, articleId, userId];

    try {
        const result = await db.query(sql, values);
        return result.affectedRows > 0;
    } catch (error) {
        console.error("Error updating article:", error);
        throw error;
    }
}

async function postNewComment(commentData) {
    const db = await database;

    const {userid, commentContent, parent_id, anc_id} = commentData;

    const article_insert_result = await db.query(
        "insert into project_comments (userid, content, parent_article_id, ancestor_article_id) values (?, ?, ?, ?)",
        [userid, commentContent, parent_id, anc_id]
    );

    commentData.id = article_insert_result.insertId;

    return commentData;
}

async function postNewCommentOnOtherComment(commentData) {
    const db = await database;

    const {userid, commentContent, parent_id, anc_id} = commentData;

    const article_insert_result = await db.query(
        "insert into project_comments (userid, content, parent_comment_id, ancestor_article_id) values (?, ?, ?, ?)",
        [userid, commentContent, parent_id, anc_id]
    );

    commentData.id = article_insert_result.insertId;

    return commentData;
}

async function getCommentsOnArticle(article_ID) {
    const db = await database;
    const sql = `
        SELECT * FROM (
            SELECT
                project_comments.id AS article_id,
                project_comments.userid,
                project_comments.content,
                project_comments.postTime,
                project_comments.parent_article_id,
                project_comments.parent_comment_id,
                project_comments.ancestor_article_id,
                project_users.username,
                project_users.fullName,
                project_users.avatar
            FROM project_comments
            LEFT JOIN project_users ON project_comments.userid = project_users.id
            WHERE parent_article_id = ?
        ) AS commentsTable
        LEFT JOIN (
            SELECT
                project_articles.id AS ancestorID,
                project_articles.userid AS ancestorUserID
            FROM project_articles
            LEFT JOIN project_users ON project_articles.userid = project_users.id
        ) AS ancestorTable 
        ON ancestorTable.ancestorID = commentsTable.ancestor_article_id
    `;

    try {
        const rows = await db.query(sql, [article_ID]);
        return rows;  // Return the fetched results
    } catch (error) {
        console.error("Error fetching comments with ancestors:", error);
        throw error;
    }

}

async function getCommentsOnOtherComment(parentCommentID) {
    const db = await database;
    const sql = `
        SELECT * FROM (
                          SELECT
                              project_comments.id AS article_id,
                              project_comments.userid,
                              project_comments.content,
                              project_comments.postTime,
                              project_comments.parent_article_id,
                              project_comments.parent_comment_id,
                              project_comments.ancestor_article_id,
                              project_users.username,
                              project_users.fullName,
                              project_users.avatar
                          FROM project_comments
                                   LEFT JOIN project_users ON project_comments.userid = project_users.id
                          WHERE parent_comment_id = ?
                      ) AS commentsTable
                          LEFT JOIN (
            SELECT
                project_articles.id AS ancestorID,
                project_articles.userid AS ancestorUserID
            FROM project_articles
                     LEFT JOIN project_users ON project_articles.userid = project_users.id
        ) AS ancestorTable
                                    ON ancestorTable.ancestorID = commentsTable.ancestor_article_id
    `;

    try {
        const rows = await db.query(sql, [parentCommentID]);
        return rows;  // Return the fetched results
    } catch (error) {
        console.error("Error fetching comments with ancestors:", error);
        throw error;
    }
}

async function deleteArticle(article_id) {
    const db = await database;
    return await db.query(`
    DELETE FROM project_articles
    WHERE id = ?
    `, [article_id]
    )
}

async function deleteComment(comment_id) {
    const db = await database;
    return await db.query(`
    DELETE FROM project_comments
    WHERE id = ?
    `, [comment_id]
    )
}


module.exports = {
    postNew,
    getArticles,
    getUserLikesArticle,
    setUserLikesArticle,
    deleteUserLike,
    getArticleById,
    updateArticle,
    postNewComment,
    getCommentsOnArticle,
    deleteArticle,
    postNewCommentOnOtherComment,
    getCommentsOnOtherComment,
    deleteComment
}