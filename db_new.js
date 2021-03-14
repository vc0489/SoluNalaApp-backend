//const { MySqlPool } = require('./MySqlPool')
const mysql = require('mysql2')

//const pool = MySqlPool()

class DataService {
  constructor(db) {
    this.db = db
  }

}
const sqlQuery = (db, query, callback) => {
  console.log(query)
  db.query(query, callback)
  //callback(err, res, fields)
}

const getCats = (db, callback) => {
  const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
  sqlQuery(db, query, callback)
}

const getNotes = (db, cat_id, note_type_id, callback) => {

  let query = `
    SELECT
      note.id,
      note.note_date AS date,
      note.note_time AS time,
      note.cat_id,
      note.note_type_id,
      note_type.type_description AS note_type,
      note.content
    FROM note
    LEFT JOIN note_type
    ON note.note_type_id=note_type.id
    WHERE 1=1
  `
  
  if (cat_id) query = mysql.format(`${query} AND cat_id=?`, cat_id)
  if (note_type_id) query = mysql.format(`${query} AND note_type_id=?`, note_type_id)
  
  sqlQuery(db, query, callback)
  
}

const postNotes = (db, insert_json_data, callback) => {
  // cat_id, note_type_id, date, time, content
  // https://stackoverflow.com/questions/8899802/how-do-i-do-a-bulk-insert-in-mysql-using-node-js
  // 
  const insert_array = insert_json_data.map(entry => {
    return [entry.cat_id, entry.note_type_id, entry.date, entry.time, entry.content]
  })
  let query = mysql.format(`
    INSERT INTO note (
      cat_id,
      note_type_id,
      note_date,
      note_time,
      content
    ) VALUES ?`,
    [insert_array]
  )

  sqlQuery(db, query, callback)

}

const getNoteTypes = (db, callback) => {
  const query = 'SELECT * FROM note_type'
  sqlQuery(db, query, callback)
}


const getWeights = (db, cat_id, callback) => {
  const query = _getWeightsQuery(cat_id)
  sqlQuery(db, query, callback)
}



const addWeights = (db, cat_id, weightsData, callback) => {
  // weightsData - array of weight entries {cat_id, grams, weigh_date}
    
  const insert_values = weightsData.map(
    data => {
      //console.log(data)
      return (`(${cat_id},${data.grams},'${data.weigh_date}')`)
    }
  )
  
  let query = insert_values.join(',')
  //console.log(`query=${query}`)
  query = 'INSERT INTO daily_weight (cat_id,grams,weigh_date) VALUES ' + query
  
  console.log(db)
  const [insertErr] = db.syncQuery(query)
  
  
  //const [insertErr] = await db.promisifiedQuery(query)
  if (insertErr) {
    console.log(insertErr)
    callback(true, {msg: "Error inserting weight(s) into DB", err: insertErr})
    return
  }

  sqlQuery(db, _getWeightsQuery(), callback)
}

const getFoodRatings = (db, callback) => {
  const query = `
    SELECT * FROM food
  `
  sqlQuery(db, query, callback)
}

const getFoods = (db, callback) => {
  const query = `
    SELECT
      b.id AS brand_id,
      b.brand AS brand,
      p.id AS product_id,
      p.product AS product
    FROM food_brand b
    LEFT JOIN food_product p
    ON b.id = p.brand_id
  `

  sqlQuery(db, query, callback)
}

const addFood = (db, foodData, callback) => {
  /* foodData schema
   {
      cat_id (int): Cat ID as in DB
      brand (obj): { 
        new_option (bool): Whether brand is new and hence not in DB)
        value (string): Name of brand
        option_id (int): Brand ID (if exists in DB)
      }
      date: Date of entry
      food (obj): { 
        new_option (bool): Whether food is new and hence not in DB)
        value (string): Name of food
        option_id (int): Food ID (if exists in DB)
      }
      rating: Rating given to food (0-5). 0 should be interpreted as no rating (null)
    }
  */
  const brand = foodData.brand.value
  const product = foodData.product.value

  let brand_id = foodData.brand.option_id
  let product_id = foodData.product.option_id
  // TODO - either use transaction, or need to check if food added (if previous submission partially failed)

  const poolConnection = pool.promise() // Use this to keep to one connection

  if (foodData.brand.new_option) {
    const [addBrandErr, addBrandRes] = db.syncQuery(_addFoodBrandQuery(brand))
    //const [addBrandErr, addBrandRes] = await db.promisifiedQuery(_addFoodBrandQuery(brand))
    if (addBrandErr) {
      console.log(err)
      callback(true, {msg: `Error adding new brand ${brand} to DB`, err: addBrandErr})
    } else {
      console.log(addBrandRes)
      brand_id = addBrandRes.insertId
    }
  }

  if (foodData.product.new_option) {
    const [addProductErr, addProductRes] = db.syncQuery(_addFoodProductQuery(brand_id, product))
    // const [addProductErr, addProductRes] = await db.promisifiedQuery(_addFoodProductQuery(brand_id, product))
    if (addProductErr) {
      console.log(addProductErr)
      callback(true, {msg: `Error adding new product ${product} to DB`, err: addProductErr})
    } else {
      console.log(res)
      product_id = res.insertId
    }
  }

  sqlQuery(
    db,
    _addFoodEntryQuery(foodData.date, foodData.cat_id, brand_id, product_id, foodData.rating),
    callback
  )

  // TODO - get new food list

}


/*
Helper functions for generating queries
*/
const _addFoodBrandQuery = brand => {
  const query = mysql.format(`
    INSERT INTO food_brand (
      brand
    )  VALUES (?)
  `, brand)

  return query
}
const _addFoodProductQuery = (brand_id, product) => {
  const query = mysql.format(`
    INSERT INTO food_product (
      brand_id, product
    )  VALUES (?, ?)
  `, [brand_id, product])

  return query
}

const _addFoodEntryQuery = (date, cat_id, brand_id, product_id, rating) => {
  const query = mysql.format(`
    INSERT INTO food (
      cat_id, food_date, brand_id, product_id, rating
    ) VALUES (?,?,?,?,?)
  `, [cat_id, date, brand_id, product_id, rating] )

  return query
}

const _getWeightsQuery = (cat_id = null) => {
    let query
    
    // Latest recorded weight (using id) grouped by (cat_id, weigh_date)
    query = `
      SELECT dw.* FROM daily_weight dw 
      JOIN (
        SELECT cat_id, MAX(id) AS max_id 
        FROM daily_weight
        GROUP BY cat_id, weigh_date
      ) latest 
      ON dw.cat_id=latest.cat_id AND dw.id=latest.max_id
    `
  
    if (cat_id) {
      query = query + mysql.format(' WHERE dw.cat_id=?', [cat_id])
    }
  
    query = query + ' ORDER BY weigh_date DESC, cat_id ASC'
    
    return query
  }

module.exports = {
  addFood,
  addWeights,
  getCats,
  getFoods,
  getFoodRatings,
  getNotes,
  getNoteTypes,
  getWeights,
  postNotes,
}