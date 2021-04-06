DROP TABLE IF EXISTS cat;
DROP TABLE IF EXISTS daily_weight;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS note_type;
DROP TABLE IF EXISTS food_rating;
CREATE TABLE cat (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
    cat_name VARCHAR(10) NOT NULL,
    breed VARCHAR(50) NOT NULL,
    colour VARCHAR(20) NOT NULL,
    birthdate DATE NOT NULL,
    late_updated DATETIME DEFAULT NOW()
);

INSERT INTO cat (id, cat_name, breed, colour, birthdate) VALUES
(
    1,
    'Luna',
    'British Shorthair',
    'Lilac',
    '2020-01-01'
),
(
    2,
    'Sola',
    'British Shorthair',
    'Cream',
    '2020-03-13'
);

CREATE TABLE daily_weight (
    id MEDIUMINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
    cat_id TINYINT UNSIGNED NOT NULL,
    grams SMALLINT UNSIGNED NOT NULL,
    weigh_date DATE NOT NULL,
    last_updated DATETIME DEFAULT NOW(),
    FOREIGN KEY (cat_id) REFERENCES cat(id)
);

INSERT INTO daily_weight (cat_id, grams, weigh_date) VALUES
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
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
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
    cat_id TINYINT UNSIGNED NOT NULL,
    note_type_id TINYINT UNSIGNED NOT NULL,
    note_date DATE NOT NULL,
    note_time VARCHAR(5) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    last_updated DATETIME DEFAULT NOW(),
    FOREIGN KEY (cat_id) REFERENCES cat(id),
    FOREIGN KEY (note_type_id) REFERENCES note_type(id)
);

INSERT INTO note (cat_id, note_type_id, note_date, content) VALUES 
(
    1,
    3,
    '2021-01-06',
    '11:00',
    'Diarrhoea'
);


CREATE TABLE food_brand (
  id SMALLINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT,
  brand_name VARCHAR(30) NOT NULL,
  last_updated DATETIME DEFAULT NOW()
);

INSERT INTO food_brand (brand_name) VALUES 
( 'KatKin' ),
( 'Bozita' ),
( 'Cosma' );


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
  cat_id TINYINT UNSIGNED NOT NULL,
  rating_date DATE NOT NULL,
  product_id SMALLINT UNSIGNED NOT NULL,
  grams SMALLINT UNSIGNED,
  rating TINYINT UNSIGNED,
  last_updated DATETIME DEFAULT NOW(),
  FOREIGN KEY (cat_id) REFERENCES cat(id),
  FOREIGN KEY (product_id) REFERENCES food_product(id)
);

INSERT INTO food_rating (cat_id, rating_date, product_id, grams, rating) VALUES
( 1, '2020-03-01', 1, 120, 4 ),
( 1, '2020-03-02', 2, 110, 3 ),
( 1, '2020-03-03', 3, NULL, 2 ),
( 1, '2020-03-04', 4, 125, NULL ),
( 1, '2020-03-05', 5, NULL, NULL ),
( 2, '2020-03-02', 9, 150, 5 );




