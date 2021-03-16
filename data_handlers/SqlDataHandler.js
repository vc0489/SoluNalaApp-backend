const mysql = require('mysql2') // For formatting queries

class SqlDataHandler {
  constructor(db) {
    this.db = db
  }

  _executeQuery(query, callback) {
    this.db.query(query, callback)
  }
  
  _syncQuery(query) {
    return this.db.syncQuery(query)
  }

  getCats(callback) {
    const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
    this._executeQuery(query, callback)
  }
  
  getFoods(callback) {
    const query = this._getFoodsQuery()
    this._executeQuery(query, callback)
  }

  getFoodRatings(callback) {
    const query = 'SELECT * FROM food'
    this._executeQuery(query, callback)
  }
  
  getNotes(cat_id, note_type_id, callback) {
    const query = this._getNotesQuery(cat_id, note_type_id)
    this._executeQuery(query, callback)
  }

  getNoteTypes(callback) {
    const query = 'SELECT * FROM note_type'
    this._executeQuery(query, callback)
  }

  getWeights(cat_id, callback) {
    const query = this._getWeightsQuery(cat_id)
    this._executeQuery(query, callback)
  }
  
  async insertFoodRating(foodData, callback) {
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

    if (foodData.brand.new_option) {
      const [addBrandErr, addBrandRes] = await this._syncQuery(this._insertFoodBrandQuery(brand))
      if (addBrandErr) {
        console.log(err)
        callback(true, {msg: `Error adding new brand ${brand} to DB`, err: addBrandErr})
      } else {
        console.log(addBrandRes)
        brand_id = addBrandRes.insertId
      }
    }
  
    if (foodData.product.new_option) {
      const [addProductErr, addProductRes] = await this._syncQuery(this._insertFoodProductQuery(brand_id, product))
      // const [addProductErr, addProductRes] = await db.promisifiedQuery(_addFoodProductQuery(brand_id, product))
      if (addProductErr) {
        console.log(addProductErr)
        callback(true, {msg: `Error adding new product ${product} to DB`, err: addProductErr})
      } else {
        console.log(res)
        product_id = res.insertId
      }
    }
  
    this._executeQuery(
      this._insertFoodRatingQuery(
        foodData.date, foodData.cat_id, brand_id, product_id, foodData.rating
      ),
      callback
    )
  }

  insertNotes(json_data, callback) {
    // cat_id, note_type_id, date, time, content
    // https://stackoverflow.com/questions/8899802/how-do-i-do-a-bulk-insert-in-mysql-using-node-js
    // 
    const insert_array = json_data.map(entry => {
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

    this._executeQuery(query, callback)
  }

  async insertWeights(cat_id, weightsData, callback) {
    // weightsData - array of weight entries {cat_id, grams, weigh_date}
      
    const insert_values = weightsData.map(
      data => {
        return (`(${cat_id},${data.grams},'${data.weigh_date}')`)
      }
    )

    let query = insert_values.join(',')
    query = 'INSERT INTO daily_weight (cat_id,grams,weigh_date) VALUES ' + query
    
    const [insertErr] = await this._syncQuery(query)
    //const [insertErr] = await db.promisifiedQuery(query)
    if (insertErr) {
      console.log(insertErr)
      callback(true, {msg: "Error inserting weight(s) into DB", err: insertErr})
      return
    }
    this._executeQuery(this._getWeightsQuery(), callback)
  }

  // Query generation helper methods/attributes

  _getFoodsQuery() {
    return `
      SELECT
        b.id AS brand_id,
        b.brand AS brand,
        p.id AS product_id,
        p.product AS product
      FROM food_brand b
      LEFT JOIN food_product p
      ON b.id = p.brand_id
    `
  }

  _getNotesQuery(cat_id, note_type_id) {
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

    if (cat_id) query += mysql.format(' AND cat_id=?', cat_id)
    if (note_type_id) query += mysql.format(' AND note_type_id=?', note_type_id)

    return query
  }

  _getWeightsQuery(cat_id = null) {
    // Latest recorded weight (using id) grouped by (cat_id, weigh_date)
    let query = `
      SELECT dw.* FROM daily_weight dw 
      JOIN (
        SELECT cat_id, MAX(id) AS max_id 
        FROM daily_weight
        GROUP BY cat_id, weigh_date
      ) latest 
      ON dw.cat_id=latest.cat_id AND dw.id=latest.max_id
    `

    if (cat_id) query += mysql.format(' WHERE dw.cat_id=?', [cat_id])

    query += ' ORDER BY weigh_date DESC, cat_id ASC'
    return query
  }

  _insertFoodBrandQuery(brand) {
    const query = mysql.format(`
      INSERT INTO food_brand (
        brand
      )  VALUES (?)
    `, brand)
  
    return query
  }

  _insertFoodProductQuery(brand_id, product) {
    const query = mysql.format(`
      INSERT INTO food_product (
        brand_id, product
      )  VALUES (?, ?)
    `, [brand_id, product])

    return query
  }
  
  _insertFoodRatingQuery(date, cat_id, brand_id, product_id, rating) {
    const query = mysql.format(`
      INSERT INTO food (
        cat_id, food_date, brand_id, product_id, rating
      ) VALUES (?,?,?,?,?)
    `, [cat_id, date, brand_id, product_id, rating] )
  
    return query
  }
}

module.exports = {
  SqlDataHandler
}

