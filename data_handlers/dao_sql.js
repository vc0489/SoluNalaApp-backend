const mysql = require('mysql2') // For formatting queries
// !Converted all queries to sync
// --> This will make it easier for service layer above to chain multiple queries
// --> Otherwise will have callback hell!
// https://codeburst.io/node-js-mysql-and-promises-4c3be599909b

const TAG_USER_TABLE = 'users'
const { getPool } = require('../get_data_accessor')

function _executeQuery(query, callback) {
  return getPool().query(query, callback)
}

function _syncQuery(query, payload = null) {
  return getPool().syncQuery(query, payload)
}

function _syncExecute(query, payload) {
  return getPool().syncExecute(query, payload)
}

async function _transaction(queries) {
  return await getPool().transaction(queries)
}

function _transactionExecute(queries) {
  return getPool().transactionExecute(queries)
}

//------------------------------------
//--- Generic single table queries ---
//------------------------------------
async function _syncExecuteSelect(table, filter_obj, cols=null) {
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

  return await _syncExecute(query, Object.values(filter_obj))
}

async function _syncExecuteInsert(table, ins_obj) {
  const fields_str = Object.keys(ins_obj).join(', ')

  const query = `
    INSERT INTO ${table}
    ( ${fields_str} )
    VALUES ?
  `

  return await _syncQuery(query, [[Object.values(ins_obj)]])
}


async function _syncExecuteBulkInsert(table, fields, data) {
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

  return await _syncQuery(query, [insert_array])
}

async function _syncExecuteUpdate(table, update_obj, filter_obj) {
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

  return await _syncExecute(query, Object.values(update_obj).concat(Object.values(filter_obj)))
}

async function _syncExecuteDelete(table, filter_obj) {
  const filters = Object.keys(filter_obj)
  const filters_str = filters.map(filter => `${filter} = ?`).join(' AND ')

  const query = `
    DELETE FROM ${table}
    WHERE ${filters_str}
  `

  return await _syncExecute(query, Object.values(filter_obj))
}


//--------------------
//--- Test queries ---
//--------------------
const testQuery = async () => {
  const query = 'SELECT * FROM test'
  const [err, data, fields] = await _syncQuery(query)
  return [err, data]
}
module.exports.testQuery = testQuery


//--------------------
//--- User queries ---
//--------------------
const checkIfEmailExists = async email => {
  const query = `SELECT COUNT(*) AS count FROM ${TAG_USER_TABLE} WHERE email=?`
  const [err, data, fields] = await _syncQuery(query, [email])
  return [err, data[0].count]
}
module.exports.checkIfEmailExists = checkIfEmailExists


const getUserCredentials = async email => {
  const query = `SELECT id, password_hash FROM ${TAG_USER_TABLE} WHERE email=?`
  const [err, rows, fields] = await _syncExecute(query, [email])
  return [err, rows]
}
module.exports.getUserCredentials = getUserCredentials


const insertUser = async (email, password_hash) => {
  const query = `
    INSERT INTO ${TAG_USER_TABLE}
    (email, password_hash)
    VALUES
    (?, ?)
  `
  const [err, result, fields] = await _syncQuery(query, [email, password_hash])
  if (Array.isArray(result)) {
    return [err, result[0].id]
  }
  return [err, result.insertId?.toString()]
}
module.exports.insertUser = insertUser


const getSlackUsers = async (user_id = null) => {
  let filterObj = {}
  if (user_id !== null) {
    filterObj = {user_id}
  }
  const [err, slack_user_ids] = await _syncExecuteSelect(
    "slack_user", filterObj, ["user_id", "slack_user_id"]
  )
  return [err, slack_user_ids]
}
module.exports.getSlackUsers = getSlackUsers


const insertSlackUser = async (user_id, slack_user_id, verification_code_hash, verification_expiry) => {
  const [err, res] = await _syncExecuteInsert(
    "slack_user", {slack_user_id, user_id, verification_code_hash, verification_expiry}
  )
  return [err, res]
}
module.exports.insertSlackUser = insertSlackUser


const getSlackUser = async (slack_user_id) => {
  const [err, res] = await _syncExecuteSelect(
    "slack_user",
    {slack_user_id}
  )
  return [err, res]
}
module.exports.getSlackUser = getSlackUser


//-------------------
//--- Cat queries ---
//-------------------
const getUserCats = async user_id => {
  const query = `
    SELECT cat.* FROM ${TAG_USER_TABLE}
    JOIN cat on ${TAG_USER_TABLE}.id=cat.user_id
    WHERE ${TAG_USER_TABLE}.id=?
  `
  const [err, rows, fields] = await _syncExecute(query, [user_id])

  return [err, rows]
}
module.exports.getUserCats = getUserCats


const insertCat = async update_obj => {
  const [insErr, insRes] = await _syncExecuteBulkInsert(
    'cat',
    ['user_id', 'cat_name', 'breed', 'colour', 'birthdate'],
    [update_obj]
  )

  if (Array.isArray(insRes)) {
    return [insErr, insRes[0]['id']]
  }
  return [insErr, insRes?.insertId.toString()]
}
module.exports.insertCat = insertCat


const updateCat = async (cat_id, update_obj) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate('cat', update_obj, {id: cat_id})
  return [updateErr, updateRes]
}
module.exports.updateCat = updateCat


const deleteCat = async cat_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete('cat', {'id': cat_id})
  return [deleteErr, deleteRes]
}
module.exports.deleteCat = deleteCat


//--------------------
//--- Food queries ---
//--------------------
const getSingleFoodBrand = async id => {
  const [err, rows, fields] = await _syncExecuteSelect(
    'food_brand',
    {id}
  )
  return [err, rows]
}
module.exports.getSingleFoodBrand = getSingleFoodBrand


const getUserFoodBrands = async user_id => {
  const [err, rows, fields] = await _syncExecuteSelect('food_brand', {user_id}, ['id', 'brand_name'])
  return [err, rows]
}
module.exports.getUserFoodBrands = getUserFoodBrands


const getFoodBrands = async () => {
  const query = 'SELECT id, brand_name FROM food_brand'
  const [err, rows, fields] = await _syncQuery(query)
  return [err, rows]
}
module.exports.getFoodBrands = getFoodBrands


const getFoodBrandProducts = async brand_id => {
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
  const [err, rows, fields] = await _syncQuery(query, [brand_id])
  return [err, rows]
}
module.exports.getFoodBrandProducts = getFoodBrandProducts


const getSingleFoodProduct = async product_id => {
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

  const [err, rows, fields] = await _syncExecuteSelect(
    table,
    {product_id}
  )
  return [err, rows]
}
module.exports.getSingleFoodProduct = getSingleFoodProduct


const getUserFoodProducts = async user_id => {
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
  const [err, rows, fields] = await _syncExecuteSelect(
    table,
    {user_id}
  )
  return [err, rows]
}
module.exports.getUserFoodProducts = getUserFoodProducts


const getFoodProducts = async (brand_id = null) => {
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
    const [err, rows, fields] = await _syncQuery(query, [brand_id])
  } else {
    const [err, rows, fields] = await _syncQuery(query)
  }

  return [err, rows]
}
module.exports.getFoodProducts = getFoodProducts


const getUserFoodRatings = async user_id => {
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

  const [err, rows, fields] = await _syncExecuteSelect(
    table,
    {user_id}
  )
  return [err, rows]
}
module.exports.getUserFoodRatings = getUserFoodRatings


const getFoodRatings = async (cat_id = null) => {
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
    const [err, rows, fields] = await _syncQuery(query, [cat_id])
    return [err, rows]
  } else {
    const [err, rows, fields] = await _syncQuery(query)
    return [err, rows]
  }
}
module.exports.getFoodRatings = getFoodRatings


const getSingleFoodRating = async rating_id => {
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

  const [err, rows, fields] = await _syncExecuteSelect(
    table,
    {rating_id}
  )
  return [err, rows]
}
module.exports.getSingleFoodRating = getSingleFoodRating


const insertFoodBrand = async (user_id, brand) => {
  // Return brand ID
  const query = _insertFoodBrandQuery(user_id, brand)
  const [insBrandErr, insBrandRes] = await _syncQuery(query)
  return [insBrandErr, insBrandRes?.insertId]
}
module.exports.insertFoodBrand = insertFoodBrand


const insertFoodProduct = async (brand_id, product) => {
  // Return product ID
  const query = _insertFoodProductQuery(brand_id, product)
  const [insProdErr, insProdRes] = await _syncQuery(query)
  return [insProdErr, insProdRes?.insertId]
}
module.exports.insertFoodProduct = insertFoodProduct


const insertFoodRating = async insert_obj => {
  const [insErr, insRes] = await _syncExecuteInsert(
    'food_rating',
    insert_obj,
  )

  return [insErr, insRes?.insertId]
}
module.exports.insertFoodRating = insertFoodRating


const updateFoodBrand = async (brand_id, brand_name) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate(
    'food_brand',
    { brand_name },
    { id: brand_id }
  )
  return [updateErr, updateRes]
}
module.exports.updateFoodBrand = updateFoodBrand


const updateFoodProduct = async (product_id, update_obj) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate(
    'food_product',
    update_obj,
    {id: product_id},
  )
  return [updateErr, updateRes]
}
module.exports.updateFoodProduct = updateFoodProduct


const updateFoodRating = async (rating_id, update_obj) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate(
    'food_rating',
    update_obj,
    {id: rating_id},
  )
  return [updateErr, updateRes]
}
module.exports.updateFoodRating = updateFoodRating


const deleteFoodBrand = async brand_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete(
    'food_brand',
    { id: brand_id }
  )
  return [deleteErr, deleteRes]
}
module.exports.deleteFoodBrand = deleteFoodBrand


const deleteFoodProduct = async product_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete(
    'food_product',
    { id: product_id }
  )
  return [deleteErr, deleteRes]
}
module.exports.deleteFoodProduct = deleteFoodProduct


const deleteFoodRating = async rating_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete(
    'food_rating',
    { id: rating_id }
  )
  return [deleteErr, deleteRes]
}
module.exports.deleteFoodRating = deleteFoodRating


//--------------------
//--- Note queries ---
//--------------------
const getSingleNote = async note_id => {
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
  const [err, rows, fields] = await _syncQuery(query, [note_id])
  return [err, rows]
}
module.exports.getSingleNote = getSingleNote


const getUserNotes = async user_id => {
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
  const [err, rows, fields] = await _syncQuery(query, [user_id])
  return [err, rows]
}
module.exports.getUserNotes = getUserNotes


const getNotesOfType = async note_type_id => {
  const [selectErr, selectRes] = await _syncExecuteSelect(
    'note',
    { note_type_id }
  )
  return [selectErr, selectRes]
}
module.exports.getNotesOfType = getNotesOfType


const getNotes = async (cat_id, note_type_id) => {
  const query = _getNotesQuery(cat_id, note_type_id)
  const [err, rows, fields] = await _syncQuery(query)
  return [err, rows]
}
module.exports.getNotes = getNotes


const getSingleNoteType = async note_type_id => {
  const [selectErr, selectRes] = await _syncExecuteSelect(
    'note_type',
    { id: note_type_id }
  )
  return [selectErr, selectRes]
}
module.exports.getSingleNoteType = getSingleNoteType


const getUserNoteTypes = async user_id => {
  const query = 'SELECT * FROM note_type WHERE user_id = ?'
  const [err, rows, fields] = await _syncQuery(query, [user_id])
  return [err, rows]
}
module.exports.getUserNoteTypes = getUserNoteTypes


const getNoteTypes = async () => {
  const query = 'SELECT * FROM note_type'
  const [err, rows, fields] = await _syncQuery(query)
  return [err, rows]
}
module.exports.getNoteTypes = getNoteTypes


const insertNoteType = async (user_id, description) => {
  const query = `
    INSERT INTO note_type
      (user_id, type_description)
    VALUES
      (?, ?)
  `
  const [insErr, insRes] = await _syncQuery(query, [user_id, description])

  if (Array.isArray(insRes)) {
    return [insErr, insRes[0].id]
  }
  return [insErr, insRes?.insertId]
}
module.exports.insertNoteType = insertNoteType


const updateNoteType = async (note_type_id, description) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate(
    'note_type',
    { type_description: description },
    { id: note_type_id }
  )
  return [updateErr, updateRes]
}
module.exports.updateNoteType = updateNoteType


const deleteNoteType = async note_type_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete(
    'note_type',
    { id: note_type_id }
  )
  return [deleteErr, deleteRes]
}
module.exports.deleteNoteType = deleteNoteType


const cascadeDeleteNoteType = async note_type_id => {
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

  const [err, rows, fields] = await _transaction(allQueries)

  if (err) {
    return [err, null]
  } else {
    return [err, rows[0].map(item => item.id)]
  }
}
module.exports.cascadeDeleteNoteType = cascadeDeleteNoteType


const insertNotes = async insert_data => {
  const [err, res] = await _syncExecuteBulkInsert(
    'note',
    ['cat_id', 'note_type_id', 'note_date', 'note_time', 'content'],
    insert_data
  )

  if (Array.isArray(res)) {
    return [err, res[0].id]
  }
  return [err, res?.insertId]
}
module.exports.insertNotes = insertNotes


const insertNotesV2 = async insertData => {
  const [err, res] = await _syncExecuteBulkInsert(
    'note',
    ['cat_id', 'note_type_id', 'note_datetime_start', 'note_datetime_end', 'content'],
    insertData
  )

  if (Array.isArray(res)) {
    return [err, res[0].id]
  }
  return [err, res?.insertId]
}
module.exports.insertNotesV2 = insertNotesV2


const updateNote = async (note_id, update_obj) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate('note', update_obj, {id: note_id})
  return [updateErr, updateRes]
}
module.exports.updateNote = updateNote


const deleteNote = async note_id => {
  const [err, res] = await _syncExecuteDelete(
    'note',
    {id: note_id}
  )
  return [err, res]
}
module.exports.deleteNote = deleteNote


//----------------------
//--- Weight queries ---
//----------------------
const getSingleWeight = async weight_id => {
  const query = `
    SELECT * FROM weight w
    JOIN cat c ON w.cat_id=c.id
    WHERE w.id = ?
  `
  const [err, rows, fields] = await _syncExecute(query, [weight_id])
  return [err, rows]
}
module.exports.getSingleWeight = getSingleWeight


const getUserWeights = async user_id => {
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
  const [err, rows, fields] = await _syncQuery(query, [user_id])
  return [err, rows]
}
module.exports.getUserWeights = getUserWeights


const getWeights = async cat_id => {
  const query = _getWeightsQuery(cat_id)
  const [err, rows, fields] = await _syncQuery(query)
  return [err, rows]
}
module.exports.getWeights = getWeights


const upsertWeights = async weightsData => {
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

  const [insQuery, insValues] = _insertWeightsQuery(weightsData)
  allQueries.push([insQuery, insValues])
  const [err, rows, fields] = await _transaction(allQueries)
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
      _sequentialIdArray(rows[2].insertId, weightsData.length)
    ]
  }
}
module.exports.upsertWeights = upsertWeights


const getWeightsOfCatDatePairs = async pairs => {
  /*
    Pairs = array of [cat_id, date]
    e.g. [
      [1, '2020-04-01'],
      [2, '2021-04-03'],
      [1, '2021-04-04']
    ]
  */

  const query = `
    SELECT * FROM weight WHERE
      (cat_id, weigh_date)
    IN
      (?)
  `
  const [err, rows, fields] = await _syncQuery(query, [pairs])
  return [err, rows]
}
module.exports.getWeightsOfCatDatePairs = getWeightsOfCatDatePairs


const insertWeights = async weightsData => {
  // weightsData - array of weight entries {cat_id, grams, weigh_date}
  const [query, values] = _insertWeightsQuery(weightsData)
  const [insertErr, insertRes] = await _syncQuery(query, values)

  if (Array.isArray(weightsData)) {
    return [insertErr, insertRes.map(row => row.id.toString())]
  }
  const firstInsertId = insertRes.insertId
  const insertIds = _sequentialIdArray(firstInsertId, weightData.length)

  return [insertErr, insertIds]
}
module.exports.insertWeights = insertWeights


const updateWeight = async (weight_id, update_obj) => {
  const [updateErr, updateRes] = await _syncExecuteUpdate(
    'weight',
    update_obj,
    { id: weight_id }
  )
  return [updateErr, updateRes]
}
module.exports.updateWeight = updateWeight


const deleteWeight = async weight_id => {
  const [deleteErr, deleteRes] = await _syncExecuteDelete(
    'weight',
    { id: weight_id }
  )
  return [deleteErr, deleteRes]
}
module.exports.deleteWeight = deleteWeight


// Utils and private query generator functions
function _sequentialIdArray(firstId, nElements) {
  const ids = Array.from(
    { length: nElements},
    (_, i) => (firstId + i).toString()
  )
  return ids
}

function _getNotesQuery(cat_id, note_type_id) {
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

  if (cat_id) query += mysql.format(' AND cat_id=?', [cat_id])
  if (note_type_id) query += mysql.format(' AND note_type_id=?', [note_type_id])

  return query
}

function _getWeightsQuery(cat_id = null) {
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

function _insertWeightsQuery(weightsData) {
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

function _insertFoodBrandQuery(user_id, brand) {
  const query = mysql.format(`
    INSERT INTO food_brand
      (user_id, brand_name)
    VALUES
      (?, ?)
  `, [user_id, brand])

  return query
}

function _insertFoodProductQuery(brand_id, product) {
  const query = mysql.format(`
    INSERT INTO food_product (
      brand_id, product
    )  VALUES (?, ?)
  `, [brand_id, product])

  return query
}
