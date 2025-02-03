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
            project_users.avatar,
            COUNT(project_article_likes.userid) as likeCount
        FROM project_articles  
        LEFT JOIN project_users ON project_articles.userid = project_users.id 
        LEFT JOIN project_article_likes ON project_articles.id = project_article_likes.article_id 
        WHERE project_articles.parent_article_id IS NULL 
        `

    if (filterByUser) {
        query += ` AND project_articles.userid = ${filterUserId} `;
    }

    query += `GROUP BY project_articles.id`

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

    const {userid, commentContent, parent_id} = commentData;

    const article_insert_result = await db.query(
        "insert into project_articles (userid, content, parent_article_id) values (?, ?, ?)",
        [userid, commentContent, parent_id]
    );

    commentData.id = article_insert_result.insertId;

    return commentData;
}

async function getCommentsOnArticle(article_id) {
    const db = await database;
    return await db.query(`
        SELECT 
            project_articles.id AS article_id, 
            project_articles.title,
            project_articles.userid,
            project_articles.content, 
            project_articles.image_path, 
            project_articles.postTime, 
            project_users.username, 
            project_users.fullName, 
            project_users.avatar,
            COUNT(project_article_likes.userid) as likeCount
        FROM project_articles  
        LEFT JOIN project_users ON project_articles.userid = project_users.id 
        LEFT JOIN project_article_likes ON project_articles.id = project_article_likes.article_id 
         WHERE parent_article_id = ?`, [article_id]);
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
    getCommentsOnArticle
}