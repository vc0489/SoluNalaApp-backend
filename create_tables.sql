USE SoluNalaDB;

DROP TABLE IF EXISTS food_rating;
DROP TABLE IF EXISTS food_product;
DROP TABLE IF EXISTS food_brand;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS weight;
DROP TABLE IF EXISTS note_type;
DROP TABLE IF EXISTS cat;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
    id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(320) NOT NULL,
    password_hash CHAR(60),
    last_updated DATETIME DEFAULT NOW()
);

CREATE TABLE cat (
    id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    user_id SMALLINT UNSIGNED NOT NULL,
    cat_name VARCHAR(10) NOT NULL,
    breed VARCHAR(50),
    colour VARCHAR(20),
    birthdate DATE,
    late_updated DATETIME DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

INSERT INTO cat (user_id, cat_name, breed, colour, birthdate) VALUES
(
    1,
    'Luna',
    'British Shorthair',
    'Lilac',
    '2020-01-01'
),
(
    1,
    'Sola',
    'British Shorthair',
    'Cream',
    '2020-03-13'
),
(
    2,
    'Terra',
    'Turkish',
    'Red',
    '2020-05-31'
);

CREATE TABLE weight (
    id MEDIUMINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    cat_id SMALLINT UNSIGNED NOT NULL,
    grams SMALLINT UNSIGNED NOT NULL,
    weigh_date DATE NOT NULL,
    last_updated DATETIME DEFAULT NOW(),
    FOREIGN KEY (cat_id) REFERENCES cat(id)
);

INSERT INTO weight (cat_id, grams, weigh_date) VALUES
(
    1,
    4250,
    '2021-01-06'
),
(
    2,
    4160,
    '2021-01-06'
),
(
    1,
    4260,
    '2021-01-05'
),
(
    2,
    4150,
    '2021-01-05'
);

CREATE TABLE note_type (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    type_description VARCHAR(50),
    last_updated DATETIME DEFAULT NOW()
);

--'Eating', 'Drinking', 'Toilet', 'Medical', 'Bathing', 'Well Being', 'Behaviour', 'Other'
INSERT INTO note_type (id, type_description) VALUES 
( 1, 'Eat' ),
( 2, 'Drink' ),
( 3, 'Toilet' ),
( 4, 'Medical' ),
( 5, 'Bath' ),
( 6, 'Groom' ),
( 7, 'Well Being' ),
( 8, 'Behaviour' ),
( 9, 'Other' );

CREATE TABLE note (
    id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    cat_id SMALLINT UNSIGNED NOT NULL,
    note_type_id TINYINT UNSIGNED NOT NULL,
    note_date DATE NOT NULL,
    note_time TIME,
    content VARCHAR(1000) NOT NULL,
    last_updated DATETIME DEFAULT NOW(),
    FOREIGN KEY (cat_id) REFERENCES cat(id),
    FOREIGN KEY (note_type_id) REFERENCES note_type(id)
);

INSERT INTO note (cat_id, note_type_id, note_date, note_time, content) VALUES 
(
    1,
    3,
    '2021-01-06',
    '11:00',
    'Diarrhoea'
),
(
    2,
    1,
    '2021-03-01',
    null,
    'Not eating'
);


CREATE TABLE food_brand (
  id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  user_id SMALLINT UNSIGNED NOT NULL,
  brand_name VARCHAR(30) NOT NULL,
  last_updated DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES user(id)
);

INSERT INTO food_brand (brand_name, user_id) VALUES 
( 'KatKin', 1 ),
( 'Bozita', 1 ),
( 'Cosma', 1 );


CREATE TABLE food_product (
  id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  brand_id SMALLINT UNSIGNED NOT NULL,
  product VARCHAR(120) NOT NULL,
  last_updated DATETIME DEFAULT NOW(),
  FOREIGN KEY (brand_id) REFERENCES food_brand(id)
);

INSERT INTO food_product (brand_id, product) VALUES 
( 1, 'Splash' ),
( 1, 'Oink' ),
( 1, 'Gobble' ),
( 1, 'Quack' ),
( 2, 'Crayfish - Chunks in Jelly'),
( 3, 'Skipjack Tuna in Jelly');



CREATE TABLE food_rating (
  id INT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  cat_id SMALLINT UNSIGNED NOT NULL,
  rating_date DATE NOT NULL,
  product_id SMALLINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED,
  last_updated DATETIME DEFAULT NOW(),
  FOREIGN KEY (cat_id) REFERENCES cat(id),
  FOREIGN KEY (product_id) REFERENCES food_product(id)
);

INSERT INTO food_rating (cat_id, rating_date, product_id, rating) VALUES
( 1, '2020-03-01', 1, 4 ),
( 1, '2020-03-02', 2, 3 ),
( 1, '2020-03-03', 3, 2 ),
( 1, '2020-03-04', 4, NULL ),
( 1, '2020-03-05', 5, NULL );

