DROP TABLE IF EXISTS cat;
DROP TABLE IF EXISTS daily_weight;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS note;
DROP TABLE IF EXISTS note_type;

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
    content VARCHAR(1000) NOT NULL,
    FOREIGN KEY (cat_id) REFERENCES cat(id),
    FOREIGN KEY (note_type_id) REFERENCES note_type(id)
);

INSERT INTO note (cat_id, note_type_id, note_date, content) VALUES 
(
    1,
    3,
    '2021-01-06',
    'Diarrhoea'
);















