-- Your database initialisation SQL here
CREATE TABLE IF NOT EXISTS project_users
(
    id INT NOT NULL primary key auto_increment,
    username VARCHAR(32),
    fullName VARCHAR(64),
    password VARCHAR(64),
    dob DATE,
    description TEXT
)

