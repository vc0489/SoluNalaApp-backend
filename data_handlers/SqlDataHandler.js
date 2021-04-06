const mysql = require('mysql2') // For formatting queries
// !Converted all queries to sync 
// --> This will make it easier for service layer above to chain multiple queries
// --> Otherwise will have callback hell!
// https://codeburst.io/node-js-mysql-and-promises-4c3be599909b

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

  async getCats() {
    const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows, fields]
  }

  async getFoodBrands() {
    const query = 'SELECT id, brand FROM food_brand'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getFoodProducts(brand_id = null) {
    const query = this._getFoodProductsQuery(brand_id)
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getFoodRatings() {
    const query = this._getFoodRatingsQuery()
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }
  
  async getNotes(cat_id, note_type_id) {
    const query = this._getNotesQuery(cat_id, note_type_id)
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getNoteTypes() {
    const query = 'SELECT * FROM note_type'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getWeights(cat_id) {
    const query = this._getWeightsQuery(cat_id)
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }
  
  async insertFoodBrand(brand) {
    // Return brand ID
    const query = this._insertFoodBrandQuery(brand)
    const [insBrandErr, insBrandRes] = await this._syncQuery(query)
    return [insBrandErr, insBrandRes?.insertId]
  }

  async insertFoodProduct(brand_id, product) {
    // Return product ID
    const query = this._insertFoodProductQuery(brand_id, product)
    const [insProdErr, insProdRes] = await this._syncQuery(query)
    console.log(query)
    console.log(insProdErr)
    return [insProdErr, insProdRes?.insertId]
  }
  
  async insertFoodRating(date, cat_id, product_id, grams, rating) {
    const query = this._insertFoodRatingQuery(date, cat_id, product_id, grams, rating)
    const [insRatingErr, insRatingRes] = await this._syncQuery(query)
    //console.log('SqlDataHandler.insertFoodRating', insRatingErr, insRatingRes)
    return [insRatingErr, insRatingRes]
  }
  
  async insertNotes(insert_data) {
    const query = this._insertNotesQuery(insert_data)
    const [err, res] = await this._syncQuery(query)
    console.log(err, res)
    return [err, res?.insertId]
  }

  async insertWeights(weightsData) {
    // weightsData - array of weight entries {cat_id, grams, weigh_date}
    
    const insert_values = weightsData.map(
      data => {
        return (`(${data.cat_id},${data.grams},'${data.date}')`)
      }
    )
    
    if (insert_values.length === 0) {
      return [{'msg': 'No valid weight data.'}, null]
    }

    console.log('insert_values', insert_values)
    let query = insert_values.join(',')
    query = 'INSERT INTO daily_weight (cat_id,grams,weigh_date) VALUES ' + query
    
    const [insertErr, insertRes] = await this._syncQuery(query)
    console.log('insertWeights.insertRes', insertRes)
    return [insertErr, insertRes?.insertId]
  }

  // Query generation helper methods/attributes

  _getFoodProductsQuery(brand_id = null) {
    let query = `
      SELECT
        b.id AS brand_id,
        b.brand,
        p.id AS product_id,
        p.product
      FROM food_brand b
      LEFT JOIN food_product p
      ON b.id = p.brand_id
    `
    if (brand_id) {
      query += mysql.format(' WHERE b.id=?', [brand_id])
    }
    return query
  }

  _getFoodRatingsQuery(cat_id) {
    let query = `
      SELECT
        f.id,
        f.cat_id,
        b.id AS brand_id,
        b.brand,
        p.id AS product_id,
        p.product,
        f.rating_date AS date,
        f.grams,
        f.rating
      FROM food_brand b
      JOIN food_product p ON b.id = p.brand_id
      JOIN food_rating f ON p.id = f.product_id
    `
    if (cat_id) {
      query += mysql.format(' WHERE f.cat_id=?', [cat_id])
    }
    return query
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

    console.log(cat_id, note_type_id)
    if (cat_id) query += mysql.format(' AND cat_id=?', [cat_id])
    if (note_type_id) query += mysql.format(' AND note_type_id=?', [note_type_id])

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
      ) VALUES (?)
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
  
  _insertFoodRatingQuery(date, cat_id, product_id, grams, rating) {
    const query = mysql.format(`
      INSERT INTO food_rating (
        cat_id, rating_date, product_id, grams, rating
      ) VALUES (?,?,?,?,?)
    `, [cat_id, date, product_id, grams, rating] )
  
    return query
  }

  _insertNotesQuery(insert_data) {
    const insert_array = insert_data.map(entry => {
      return [entry.cat_id, entry.note_type_id, entry.date, entry.time, entry.content]
    })

    const query = mysql.format(`
      INSERT INTO note (
        cat_id,
        note_type_id,
        note_date,
        note_time,
        content
      ) VALUES ?`,
      [insert_array]
    )
    return query
  }

  _insertWeightsQuery() {
    return ''
  }
}

module.exports = SqlDataHandler

