-- Your database initialisation SQL here
CREATE TABLE IF NOT EXISTS project_users
(
    id INT NOT NULL primary key auto_increment,
    username VARCHAR(32) unique,
    fullName VARCHAR(64) NOT NULL,
    password VARCHAR(64) NOT NULL,
    avatar VARCHAR(6) NOT NULL,
    dob DATE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS project_articles
(
    id INT primary key auto_increment,
    userid int not null,
    postTime datetime DEFAULT NOW(),
    title VARCHAR(32),
    content TEXT not null ,
    image_path VARCHAR(64),
    FOREIGN KEY (userid) REFERENCES project_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_article_parents
(
    article_id int not null,
    parent_article_id int not null,
    FOREIGN KEY (article_id) REFERENCES project_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_article_id) REFERENCES project_articles(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, parent_article_id)
);

CREATE TABLE IF NOT EXISTS project_article_likes
(
    article_id int not null,
    userid int not null,
    FOREIGN KEY (article_id) REFERENCES project_articles (id) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES project_users (id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, userid)
);



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
WHERE project_articles.userid = 2
GROUP BY project_articles.id