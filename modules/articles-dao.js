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

async function getArticles() {
    const db = await database;

    const articles_result = await db.query(
        "SELECT * FROM project_articles LEFT JOIN project_users ON project_articles.userid = project_users.id",
    )

    return articles_result.rows;
}


module.exports = {
    postNew,
    getArticles
}