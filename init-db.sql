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

CREATE TABLE IF NOT EXISTS project_images
(
    id INT PRIMARY KEY AUTO_INCREMENT,
    mime_type VARCHAR(100) NOT NULL,
    original_filename VARCHAR(255),
    byte_size INT NOT NULL,
    width INT,
    height INT,
    image_data MEDIUMBLOB NOT NULL,
    created_at DATETIME DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_articles
(
    id INT primary key auto_increment,
    userid int not null,
    postTime datetime DEFAULT NOW(),
    title VARCHAR(32),
    content TEXT not null,
    image_id int(11) DEFAULT NULL,
    ai_summary TEXT DEFAULT NULL,
    ai_summary_updated_at DATETIME DEFAULT NULL,
    FOREIGN KEY (userid) REFERENCES project_users(id) ON DELETE CASCADE
    FOREIGN KEY (image_id) REFERENCES project_images(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS project_comments
(
    id INT primary key auto_increment,
    userid int not null,
    postTime datetime DEFAULT NOW(),
    content TEXT not null,
    parent_article_id INT,
    parent_comment_id INT,
    ancestor_article_id INT NOT NULL,
    FOREIGN KEY (parent_article_id) REFERENCES project_articles(id),
    FOREIGN KEY (ancestor_article_id) REFERENCES project_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES project_comments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_article_likes
(
    article_id int not null,
    userid int not null,
    FOREIGN KEY (article_id) REFERENCES project_articles (id) ON DELETE CASCADE,
    FOREIGN KEY (userid) REFERENCES project_users (id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, userid)
);
