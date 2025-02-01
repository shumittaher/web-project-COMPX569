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
)

