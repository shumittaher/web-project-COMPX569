const database = require("./database.js");

async function postNew(articleData) {
    const db = await database;

    const {userid, title, content, image_path} = articleData;

    const article_insert_result = await db.query(
        "insert into project_articles (userid, title, content, image_path) values (?, ?, ?, ?)",
        [userid, title, content, image_path]
    );

    articleData.id = article_insert_result.insertId;

    const article_relation_id = await db.query(
        "insert into project_article_parents (article_id, parent_article_id) values (?, ?)",
        [articleData.id, articleData.id]
    );

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
                project_users.avatar 
            FROM project_articles LEFT JOIN project_users 
                ON project_articles.userid = project_users.id `

    if (filterByUser) {
        query += ` WHERE project_articles.userid = ${filterUserId} `;
    }
    if (sortSelectState !== '') {
        query += ` ORDER BY ${sortSelectState} ${sortTypeState} `;
    }
    return await db.query(
        query
    )
}


module.exports = {
    postNew,
    getArticles
}