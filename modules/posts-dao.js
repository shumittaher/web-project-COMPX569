const database = require("./database.js");

async function postnew(articleData) {
    const db = await database;

    const {userid, title, content, parentArticleID, image_path} = articleData;

    const result = await db.query(
        "insert into project_articles (userid, title, content, parentArticleID, image_path) values (?, ?, ?, ?, ?)",
        [userid, title, content, parentArticleID, image_path]
    );

    articleData.id = result.insertId;
    return articleData;

}
module.exports = {
    postnew,
}