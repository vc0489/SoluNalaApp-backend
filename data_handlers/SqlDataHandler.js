const mysql = require('mysql2') // For formatting queries
// !Converted all queries to sync
// --> This will make it easier for service layer above to chain multiple queries
// --> Otherwise will have callback hell!
// https://codeburst.io/node-js-mysql-and-promises-4c3be599909b

const TAG_USER_TABLE = 'users'
const { getPool } = require('../get_data_accessor')
class SqlDataHandler {
  constructor() {
    //  this.db = require('./get_data_accessor').getPool()
    this.db = getPool()
  }

  _executeQuery(query, callback) {
    this.db.query(query, callback)
  }


  _syncQuery(query, payload = null) {
    return this.db.syncQuery(query, payload)
  }

  _syncExecute(query, payload) {
    return this.db.syncExecute(query, payload)
  }

  async _transaction(queries) {
    return await this.db.transaction(queries)
  }

  _transactionExecute(queries) {
    return this.db.transactionExecute(queries)
  }

  //------------------------------------
  //--- Generic single table queries ---
  //------------------------------------
  async _syncExecuteSelect(table, filter_obj, cols=null) {
    let filters_str = ''
    if (filter_obj && Object.keys(filter_obj).length > 0) {
      const filters = Object.keys(filter_obj)
    filters_str = ' WHERE ' + filters.map(filter => `${filter} = ?`).join(' AND ')
    }

    let col_str;
    if (cols === null) {
      col_str = '*'
    } else {
      col_str = cols.join(',')
    }
    const query = `
      SELECT ${col_str} FROM ${table}
      ${filters_str}
    `

    return await this._syncExecute(query, Object.values(filter_obj))
  }

  async _syncExecuteInsert(table, ins_obj) {
    const fields_str = Object.keys(ins_obj).join(', ')

    const query = `
      INSERT INTO ${table}
      ( ${fields_str} )
      VALUES ?
    `

    return await this._syncQuery(query, [[Object.values(ins_obj)]])
  }

  // async _syncExecuteInsert(table, fields, data) {
  //   const fields_str = fields.join(', ')

  //   const insert_row = []
  //   for (field of fields) {
  //     insert_row.push(data[field])
  //   }

  //   const query = `
  //     INSERT INTO ${table}
  //     ( ${fields_str} )
  //     VALUES ?
  //   `

  //   return await this._syncQuery(query, [[insert_row]])
  // }

  async _syncExecuteBulkInsert(table, fields, data) {
    const insert_array = data.map(entry => {
      const insert_row = []
      for (field of fields) {
        insert_row.push(entry[field])
      }
      return insert_row
    })

    const fields_str = fields.join(', ')
    const query = `
      INSERT INTO ${table}
      ( ${fields_str} )
      VALUES ?
    `

    return await this._syncQuery(query, [insert_array])
  }

  async _syncExecuteUpdate(table, update_obj, filter_obj) {
    const items = Object.keys(update_obj)
    const items_str = items.map(item => `${item} = ?`)
    const update_str = items_str.join(',')

    const filters = Object.keys(filter_obj)
    const filters_str = filters.map(filter => `${filter} = ?`).join(' AND ')
    const query = `
      UPDATE ${table}
      SET ${update_str}
      WHERE ${filters_str}
    `

    return await this._syncExecute(query, Object.values(update_obj).concat(Object.values(filter_obj)))
  }

  async _syncExecuteDelete(table, filter_obj) {
    const filters = Object.keys(filter_obj)
    const filters_str = filters.map(filter => `${filter} = ?`).join(' AND ')

    const query = `
      DELETE FROM ${table}
      WHERE ${filters_str}
    `

    return await this._syncExecute(query, Object.values(filter_obj))
  }


  //--------------------
  //--- Test queries ---
  //--------------------
  async testQuery() {
    const query = 'SELECT * FROM test'
    const [err, data, fields] = await this._syncQuery(query)
    return [err, data]
  }

  //--------------------
  //--- User queries ---
  //--------------------
  async checkIfEmailExists(email) {
    const query = `SELECT COUNT(*) AS count FROM ${TAG_USER_TABLE} WHERE email=?`
    const [err, data, fields] = await this._syncQuery(query, [email])
    return [err, data[0].count]
  }

  async getUserCredentials(email) {
    const query = `SELECT id, password_hash FROM ${TAG_USER_TABLE} WHERE email=?`
    const [err, rows, fields] = await this._syncExecute(query, [email])
    return [err, rows]
  }

  async insertUser(email, password_hash) {
    const query = `
      INSERT INTO ${TAG_USER_TABLE}
      (email, password_hash)
      VALUES
      (?, ?)
    `
    const [err, result, fields] = await this._syncQuery(query, [email, password_hash])
    if (Array.isArray(result)) {
      return [err, result[0].id]
    }
    return [err, result.insertId?.toString()]
  }

  async getSlackUsers(user_id = null) {
    let filterObj = {}
    if (user_id !== null) {
      filterObj = {user_id}
    }
    const [err, slack_user_ids] = await this._syncExecuteSelect(
      "slack_user", filterObj, ["user_id", "slack_user_id"]
    )
    return [err, slack_user_ids]
  }

  async insertSlackUser(user_id, slack_user_id) {
    const [err, res] = await this._syncExecuteInsert(
      "slack_user", {slack_user_id, user_id}
    )
    return [err, res]
  }

  //-------------------
  //--- Cat queries ---
  //-------------------
  async getUserCats(user_id) {

    const query = `
      SELECT cat.* FROM ${TAG_USER_TABLE}
      JOIN cat on ${TAG_USER_TABLE}.id=cat.user_id
      WHERE ${TAG_USER_TABLE}.id=?
    `
    const [err, rows, fields] = await this._syncExecute(query, [user_id])

    return [err, rows]
  }

  async insertCat(update_obj) {
    const [insErr, insRes] = await this._syncExecuteBulkInsert(
      'cat',
      ['user_id', 'cat_name', 'breed', 'colour', 'birthdate'],
      [update_obj]
    )

    if (Array.isArray(insRes)) {
      return [insErr, insRes[0]['id']]
    }
    return [insErr, insRes?.insertId.toString()]
  }

  async updateCat(cat_id, update_obj) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate('cat', update_obj, {id: cat_id})
    return [updateErr, updateRes]
  }

  async deleteCat(cat_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete('cat', {'id': cat_id})
    return [deleteErr, deleteRes]
  }

  /*
  async getCats() {
    const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }
  */
  //--------------------
  //--- Food queries ---
  //--------------------
  async getSingleFoodBrand(id) {
    const [err, rows, fields] = await this._syncExecuteSelect(
      'food_brand',
      {id}
    )
    return [err, rows]
  }

  async getUserFoodBrands(user_id) {
    const [err, rows, fields] = await this._syncExecuteSelect('food_brand', {user_id}, ['id', 'brand_name'])
    return [err, rows]
  }

  async getFoodBrands() {
    const query = 'SELECT id, brand_name FROM food_brand'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getFoodBrandProducts(brand_id) {
    // const query = this._getFoodBrandProductsQuery(brand_id)
    const query = `
      SELECT
        b.id AS brand_id,
        b.brand_name AS brand,
        p.id AS product_id,
        p.product
      FROM food_brand b
      LEFT JOIN food_product p
      ON b.id = p.brand_id
      WHERE b.id = ?
    `
    const [err, rows, fields] = await this._syncQuery(query, [brand_id])
    return [err, rows]
  }

  async getSingleFoodProduct(product_id) {
    const table = `
      (
        SELECT
          b.id AS brand_id,
          b.user_id,
          b.brand_name,
          p.id AS product_id,
          p.product
        FROM food_brand b
        JOIN food_product p ON b.id=p.brand_id
      ) t
    `

    const [err, rows, fields] = await this._syncExecuteSelect(
      table,
      {product_id}
    )
    return [err, rows]
  }

  async getUserFoodProducts(user_id) {
    /*
    SELECT
        b.id AS brand_id,
        b.brand_name AS brand,
        p.id AS product_id,
        p.product
      FROM food_brand b
      JOIN food_product p
      ON b.id = p.brand_id
      WHERE b.user_id = ?
    */

    const table = `
      (
        SELECT
          b.user_id,
          b.id AS brand_id,
          b.brand_name,
          p.id AS product_id,
          p.product
        FROM food_brand b
        JOIN food_product p
        ON b.id = p.brand_id
      ) t
    `
    const [err, rows, fields] = await this._syncExecuteSelect(
      table,
      {user_id}
    )
    return [err, rows]
    //const query = this._getUserFoodProductsQuery(user_id)
    //const [err, rows, fields] = await this._syncQuery(query)
    //return [err, rows]
  }

  async getFoodProducts(brand_id = null) {
    let query = `
      SELECT
        b.id AS brand_id,
        b.brand_name AS brand,
        p.id AS product_id,
        p.product
      FROM food_brand b
      LEFT JOIN food_product p
      ON b.id = p.brand_id
    `
    if (brand_id) {
      query += ' WHERE b.id=?'
      const [err, rows, fields] = await this._syncQuery(query, [brand_id])
    } else {
      const [err, rows, fields] = await this._syncQuery(query)
    }

    return [err, rows]
  }

  async getUserFoodRatings(user_id) {
    const table = `
      (
        SELECT
          f.id,
          f.cat_id,
          b.id AS brand_id,
          b.user_id,
          b.brand_name AS brand,
          p.id AS product_id,
          p.product,
          f.rating_date AS date,
          f.rating
        FROM food_brand b
        JOIN food_product p ON b.id = p.brand_id
        JOIN food_rating f ON p.id = f.product_id
      ) t
    `

    const [err, rows, fields] = await this._syncExecuteSelect(
      table,
      {user_id}
    )
    return [err, rows]
  }

  async getFoodRatings() {
    const query = `
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
      query += ' WHERE f.cat_id=?'
      const [err, rows, fields] = await this._syncQuery(query, [cat_id])
      return [err, rows]
    } else {
      const [err, rows, fields] = await this._syncQuery(query)
      return [err, rows]
    }
    // const query = this._getFoodRatingsQuery()
    // const [err, rows, fields] = await this._syncQuery(query)
    // return [err, rows]
  }

  async getSingleFoodRating(rating_id) {
    const table = `
      (
        SELECT
          b.id AS brand_id,
          b.user_id,
          b.brand_name,
          p.id AS product_id,
          p.product,
          r.id AS rating_id,
          r.cat_id,
          r.rating_date,
          r.rating,
          r.last_updated
        FROM food_brand b
        JOIN food_product p ON b.id=p.brand_id
        JOIN food_rating r on p.id=r.product_id
      ) t
    `

    const [err, rows, fields] = await this._syncExecuteSelect(
      table,
      {rating_id}
    )
    return [err, rows]
  }

  async insertFoodBrand(user_id, brand) {
    // Return brand ID
    const query = this._insertFoodBrandQuery(user_id, brand)
    const [insBrandErr, insBrandRes] = await this._syncQuery(query)
    return [insBrandErr, insBrandRes?.insertId]
  }

  async insertFoodProduct(brand_id, product) {
    // Return product ID
    const query = this._insertFoodProductQuery(brand_id, product)
    const [insProdErr, insProdRes] = await this._syncQuery(query)
    return [insProdErr, insProdRes?.insertId]
  }


  //async insertFoodRating(date, cat_id, product_id, rating) {
  async insertFoodRating(insert_obj) {
    const [insErr, insRes] = await this._syncExecuteInsert(
      'food_rating',
      insert_obj,
    )
    // const [insErr, insRes] = await this._syncExecuteInsert(
    //   'food_rating',
    //   ['cat_id', 'rating_date', 'product_id', 'rating'],
    //   insert_obj
    // )

    return [insErr, insRes?.insertId]

    //const query = this._insertFoodRatingQuery(date, cat_id, product_id, rating)
    //const [insRatingErr, insRatingRes] = await this._syncQuery(query)
    //return [insRatingErr, insRatingRes?.insertId]
  }

  async updateFoodBrand(brand_id, brand_name) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate(
      'food_brand',
      { brand_name },
      { id: brand_id }
    )
    return [updateErr, updateRes]
  }

  async updateFoodProduct(product_id, update_obj) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate(
      'food_product',
      update_obj,
      {id: product_id},
    )
    return [updateErr, updateRes]
  }

  async updateFoodRating(rating_id, update_obj) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate(
      'food_rating',
      update_obj,
      {id: rating_id},
    )
    return [updateErr, updateRes]
  }

  async deleteFoodBrand(brand_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete(
      'food_brand',
      { id: brand_id }
    )
    return [deleteErr, deleteRes]
  }

  async deleteFoodProduct(product_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete(
      'food_product',
      { id: product_id }
    )
    return [deleteErr, deleteRes]
  }

  async deleteFoodRating(rating_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete(
      'food_rating',
      { id: rating_id }
    )
    return [deleteErr, deleteRes]
  }
  //--------------------
  //--- Note queries ---
  //--------------------
  async getSingleNote(note_id) {
    const query = `
      SELECT
        cat.user_id,
        note.id,
        note.note_date,
        note.note_time,
        note.cat_id,
        note.note_type_id,
        note_type.type_description,
        note.content
      FROM cat
      JOIN note ON cat.id=note.cat_id
      LEFT JOIN note_type
      ON note.note_type_id=note_type.id
      WHERE note.id = ?
    `
    const [err, rows, fields] = await this._syncQuery(query, [note_id])
    return [err, rows]
    // const query = `
    //   SELECT * FROM note n
    //   JOIN cat c
    //   ON n.cat_id = c.id
    //   WHERE n.id = ?
    // `

    // const [selectErr, selectRes] = await this._syncExecute(
    //   query, [note_id]
    // )
    // return [selectErr, selectRes]
  }


  async getUserNotes(user_id) {
    const query = `
      SELECT
        note.id,
        note.note_date,
        note.note_time,
        note.cat_id,
        note.note_type_id,
        note_type.type_description,
        note.content
      FROM cat
      JOIN note ON cat.id=note.cat_id
      LEFT JOIN note_type
      ON note.note_type_id=note_type.id
      WHERE cat.user_id = ?
    `
    const [err, rows, fields] = await this._syncQuery(query, [user_id])
    return [err, rows]
  }

  async getNotesOfType(note_type_id) {
    const [selectErr, selectRes] = await this._syncExecuteSelect(
      'note',
      { note_type_id }
    )
    return [selectErr, selectRes]
  }

  async getNotes(cat_id, note_type_id) {
    const query = this._getNotesQuery(cat_id, note_type_id)
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async getSingleNoteType(note_type_id) {
    const [selectErr, selectRes] = await this._syncExecuteSelect(
      'note_type',
      { id: note_type_id }
    )
    return [selectErr, selectRes]
  }

  async getUserNoteTypes(user_id) {
    // const query = mysql.format(`
    //   SELECT * FROM note_type
    //   WHERE user_id = ?
    //   `, [user_id]
    // )
    const query = 'SELECT * FROM note_type WHERE user_id = ?'
    const [err, rows, fields] = await this._syncQuery(query, [user_id])
    return [err, rows]
  }

  async getNoteTypes() {
    const query = 'SELECT * FROM note_type'
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async insertNoteType(user_id, description) {
    const query = `
      INSERT INTO note_type
        (user_id, type_description)
      VALUES
        (?, ?)
    `
    const [insErr, insRes] = await this._syncQuery(query, [user_id, description])

    if (Array.isArray(insRes)) {
      return [insErr, insRes[0].id]
    }
    return [insErr, insRes?.insertId]
  }

  async updateNoteType(note_type_id, description) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate(
      'note_type',
      { type_description: description },
      { id: note_type_id }
    )
    return [updateErr, updateRes]
  }

  async deleteNoteType(note_type_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete(
      'note_type',
      { id: note_type_id }
    )
    return [deleteErr, deleteRes]
  }

  async cascadeDeleteNoteType(note_type_id) {
    const allQueries = []

    allQueries.push([`
      SELECT id FROM note WHERE note_type_id = ?
    `, [note_type_id]])

    allQueries.push([`
      DELETE FROM note WHERE note_type_id = ?
    `, [note_type_id]])

    allQueries.push([`
      DELETE FROM note_type WHERE id = ?
    `, [note_type_id]])

    const [err, rows, fields] = await this._transaction(allQueries)

    if (err) {
      return [err, null]
    } else {
      return [err, rows[0].map(item => item.id)]
    }
  }

  async insertNotes(insert_data) {
    //const query = this._insertNotesQuery(insert_data)
    //const [err, res] = await this._syncQuery(query)
    //console.log(err, res)
    const [err, res] = await this._syncExecuteBulkInsert(
      'note',
      ['cat_id', 'note_type_id', 'note_date', 'note_time', 'content'],
      insert_data
    )

    if (Array.isArray(res)) {
      return [err, res[0].id]
    }
    return [err, res?.insertId]
  }

  async insertNotesV2(insertData) {
    const [err, res] = await this._syncExecuteBulkInsert(
      'note',
      ['cat_id', 'note_type_id', 'note_datetime_start', 'note_datetime_end', 'content'],
      insertData
    )

    if (Array.isArray(res)) {
      return [err, res[0].id]
    }
    return [err, res?.insertId]
  }

  async updateNote(note_id, update_obj) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate('note', update_obj, {id: note_id})
    return [updateErr, updateRes]
  }

  async deleteNote(note_id) {
    const [err, res] = await this._syncExecuteDelete(
      'note',
      {id: note_id}
    )
    return [err, res]
  }
  //----------------------
  //--- Weight queries ---
  //----------------------
  async getSingleWeight(weight_id) {
    const query = `
      SELECT * FROM weight w
      JOIN cat c ON w.cat_id=c.id
      WHERE w.id = ?
    `
    const [err, rows, fields] = await this._syncExecute(query, [weight_id])
    return [err, rows]
  }

  async getUserWeights(user_id) {
    const query = `
      SELECT w.* FROM
      ${TAG_USER_TABLE} u JOIN cat c on u.id = c.user_id
      JOIN weight w on c.id = w.cat_id
      JOIN (
        SELECT cat_id, MAX(id) AS max_id
        FROM weight
        GROUP BY cat_id, weigh_date
      ) latest
      ON w.cat_id=latest.cat_id AND w.id=latest.max_id
      WHERE u.id = ?
    `
    // const query = this._getUserWeightsQuery(user_id)
    const [err, rows, fields] = await this._syncQuery(query, [user_id])
    return [err, rows]
  }

  async getWeights(cat_id) {
    const query = this._getWeightsQuery(cat_id)
    const [err, rows, fields] = await this._syncQuery(query)
    return [err, rows]
  }

  async upsertWeights(weightsData) {
    const pairs = weightsData.map(item => [item.cat_id, item.date])

    const allQueries = []

    // Delete existing weights with matching (cat_id, date) pairs
    allQueries.push([
      `
      SELECT id FROM weight WHERE
        (cat_id, weigh_date)
      IN
        (?)
      `,
      [pairs]
    ])

    allQueries.push([
      `
      DELETE FROM weight WHERE
        (cat_id, weigh_date)
      IN
        (?)
      `,
      [pairs]
    ])

    const [insQuery, insValues] = this._insertWeightsQuery(weightsData)
    allQueries.push([insQuery, insValues])
    const [err, rows, fields] = await this._transaction(allQueries)
    if (err) {
      return [err, null]
    } else {
      //  'DeletedIds': rows[0].map(item => item.id),
      //  'FirstNewId': rows[2].insertId
      if (Array.isArray(rows[2])) {
        return [err, rows[0].map(item => item.id), rows[2].map(weight => weight.id)]
      }
      return [
        err,
        rows[0].map(item => item.id),
        this._sequentialIdArray(rows[2].insertId, weightsData.length)
      ]
    }
  }

  async getWeightsOfCatDatePairs(pairs) {
    /*
      Pairs = array of [cat_id, date]
      e.g. [
        [1, '2020-04-01'],
        [2, '2021-04-03'],
        [1, '2021-04-04']
      ]
    */
    // const query = mysql.format(`
    //   SELECT * FROM weight WHERE
    //     (cat_id, date)
    //   IN
    //     (?)
    // `, [pairs])

    const query = `
      SELECT * FROM weight WHERE
        (cat_id, weigh_date)
      IN
        (?)
    `
    const [err, rows, fields] = await this._syncQuery(query, [pairs])
    return [err, rows]
  }

  async insertWeights(weightsData) {
    // weightsData - array of weight entries {cat_id, grams, weigh_date}
    const [query, values] = this._insertWeightsQuery(weightsData)
    const [insertErr, insertRes] = await this._syncQuery(query, values)

    if (Array.isArray(weightsData)) {
      return [insertErr, insertRes.map(row => row.id.toString())]
    }
    const firstInsertId = insertRes.insertId
    const insertIds = this._sequentialIdArray(firstInsertId, weightData.length)

    return [insertErr, insertIds]
  }

  async updateWeight(weight_id, update_obj) {
    const [updateErr, updateRes] = await this._syncExecuteUpdate(
      'weight',
      update_obj,
      { id: weight_id }
    )
    return [updateErr, updateRes]
  }

  async deleteWeight(weight_id) {
    const [deleteErr, deleteRes] = await this._syncExecuteDelete(
      'weight',
      { id: weight_id }
    )
    return [deleteErr, deleteRes]
  }

  // Utils
  _sequentialIdArray(firstId, nElements) {
    const ids = Array.from(
      { length: nElements},
      (_, i) => (firstId + i).toString()
    )
    return ids
  }
  // Private queries

  // Query generation helper methods/attributes
  // _getFoodBrandProductsQuery(brand_id) {
  //   const query = mysql.format(`
  //     SELECT
  //       b.id AS brand_id,
  //       b.brand_name AS brand,
  //       p.id AS product_id,
  //       p.product
  //     FROM food_brand b
  //     LEFT JOIN food_product p
  //     ON b.id = p.brand_id
  //     WHERE b.id = ?
  //   `, [brand_id])
  //   return query
  // }

  // _getUserFoodProductsQuery(user_id) {
  //   const query = mysql.format(`
  //     SELECT
  //       b.id AS brand_id,
  //       b.brand_name AS brand,
  //       p.id AS product_id,
  //       p.product
  //     FROM food_brand b
  //     JOIN food_product p
  //     ON b.id = p.brand_id
  //     WHERE b.user_id = ?
  //   `, [user_id])
  //   return query
  // }

  // _getFoodProductsQuery(brand_id = null) {
  //   let query = `
  //     SELECT
  //       b.id AS brand_id,
  //       b.brand_name AS brand,
  //       p.id AS product_id,
  //       p.product
  //     FROM food_brand b
  //     LEFT JOIN food_product p
  //     ON b.id = p.brand_id
  //   `
  //   if (brand_id) {
  //     query += mysql.format(' WHERE b.id=?', [brand_id])
  //   }
  //   return query
  // }

  // _getUserFoodRatingsQuery(user_id) {
  //   const query = mysql.format(`
  //     SELECT
  //       f.id,
  //       f.cat_id,
  //       b.id AS brand_id,
  //       b.brand_name AS brand,
  //       p.id AS product_id,
  //       p.product,
  //       f.rating_date AS date,
  //       f.rating
  //     FROM user u
  //     JOIN food_brand b ON u.id = b.user_id
  //     JOIN food_product p ON b.id = p.brand_id
  //     JOIN food_rating f ON p.id = f.product_id
  //     WHERE u.id = ?
  //   `, [user_id])

  //   return query
  // }

  // _getFoodRatingsQuery(cat_id) {
  //   let query = `
  //     SELECT
  //       f.id,
  //       f.cat_id,
  //       b.id AS brand_id,
  //       b.brand,
  //       p.id AS product_id,
  //       p.product,
  //       f.rating_date AS date,
  //       f.grams,
  //       f.rating
  //     FROM food_brand b
  //     JOIN food_product p ON b.id = p.brand_id
  //     JOIN food_rating f ON p.id = f.product_id
  //   `
  //   if (cat_id) {
  //     query += mysql.format(' WHERE f.cat_id=?', [cat_id])
  //   }
  //   return query
  // }

  // _getUserNotesQuery(user_id) {
  //   const query = mysql.format(`
  //     SELECT
  //       note.id,
  //       note.note_date,
  //       note.note_time,
  //       note.cat_id,
  //       note.note_type_id,
  //       note_type.type_description,
  //       note.content
  //     FROM user
  //     JOIN cat ON user.id=cat.user_id
  //     JOIN note ON cat.id=note.cat_id
  //     LEFT JOIN note_type
  //     ON note.note_type_id=note_type.id
  //     WHERE user.id = ?
  //   `, [user_id])
  //   return query
  // }

  _getNotesQuery(cat_id, note_type_id) {
    let query = `
      SELECT
        note.id,
        note.note_date,
        note.note_time,
        note.cat_id,
        note.note_type_id,
        note_type.type_description,
        note.content
      FROM note
      LEFT JOIN note_type
      ON note.note_type_id=note_type.id
      WHERE 1=1
    `

    //console.log(cat_id, note_type_id)
    if (cat_id) query += mysql.format(' AND cat_id=?', [cat_id])
    if (note_type_id) query += mysql.format(' AND note_type_id=?', [note_type_id])

    return query
  }

  _getUserWeightsQuery(user_id) {
    let query = mysql.format(`
      SELECT w.* FROM
      user u JOIN cat c on u.id = c.user_id
      JOIN weight w on c.id = w.cat_id
      JOIN (
        SELECT cat_id, MAX(id) AS max_id
        FROM weight
        GROUP BY cat_id, weigh_date
      ) latest
      ON w.cat_id=latest.cat_id AND w.id=latest.max_id
      WHERE u.id = ?
    `, [user_id])

    return query
  }

  _getWeightsQuery(cat_id = null) {
    // Latest recorded weight (using id) grouped by (cat_id, weigh_date)
    let query = `
      SELECT w.* FROM weight w
      JOIN (
        SELECT cat_id, MAX(id) AS max_id
        FROM weight
        GROUP BY cat_id, weigh_date
      ) latest
      ON w.cat_id=latest.cat_id AND w.id=latest.max_id
    `

    if (cat_id) query += mysql.format(' WHERE w.cat_id=?', [cat_id])

    query += ' ORDER BY weigh_date DESC, cat_id ASC'
    return query
  }

  _insertWeightsQuery(weightsData) {
    const insertValues = weightsData.map(
      item => [item.cat_id, item.grams, item.date]
    )

    const query = `
      INSERT INTO weight
        (cat_id, grams, weigh_date)
      VALUES
        ?
    `

    return [query, [insertValues]]
  }

  _insertFoodBrandQuery(user_id, brand) {
    const query = mysql.format(`
      INSERT INTO food_brand
        (user_id, brand_name)
      VALUES
        (?, ?)
    `, [user_id, brand])

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

  _insertFoodRatingQuery(date, cat_id, product_id, rating) {
    const query = mysql.format(`
      INSERT INTO food_rating (
        cat_id, rating_date, product_id, rating
      ) VALUES (?,?,?,?)
    `, [cat_id, date, product_id, rating] )

    return query
  }

  _insertNotesQuery(insert_data) {
    const insert_array = insert_data.map(entry => {
      return [
        entry.cat_id, entry.note_type_id, entry.note_date, entry.note_time, entry.content
      ]
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

}

// let dataHandler
// module.exports = {
//   getDataHandler: () => {
//     if (dataHandler) {
//       console.log('Using existing dataHandler')
//       return dataHandler
//     } else {

//     }
//   }
// }
module.exports = SqlDataHandler

