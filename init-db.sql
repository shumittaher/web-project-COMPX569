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
    parentArticleID int null,
    image_path VARCHAR(64),
    FOREIGN KEY (userid) REFERENCES project_users(id),
    FOREIGN KEY (parentArticleID) REFERENCES project_articles(id)
)

