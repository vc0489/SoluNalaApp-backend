require('dotenv').config()
//const mysql = require('mysql2/promise')
const mysql = require('mysql2')
//const promisify = require('utils').promisify


const pool = mysql.createPool({
  host: process.env.AWS_DB_HOST,
  user: process.env.AWS_DB_USERNAME,
  password: process.env.AWS_DB_PASSWORD,
  database: process.env.AWS_DB_NAME,
  connectionLimit: 5
})

const sqlQuery = (query, callback) => {
  pool.getConnection((err, conn) => {
    if (err) {
      console.log(err)
      callback(true)
      return
    }

    //console.log(`In sqlQuery: query=${query}`)
    conn.query(query, (err, res) => {
      conn.release()
      if (err) {
        console.log(err)
        callback(true)
        return
      }
      //console.log(`In sqlQuery: res=${res}`)
      callback(false, res)
    })
  })
}

const getCats = callback => {
  const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
  sqlQuery(query, callback)
}

const getFoods = callback => {
  const query = `
    SELECT
      b.id AS brand_id,
      b.brand_name AS brand,
      d.id AS food_id,
      d.details AS food
    FROM food_brand b
    LEFT JOIN food_detail d
    ON b.id = d.brand_id
  `

  sqlQuery(query, callback)
}

const getNotes = (cat_id, note_type_id, callback) => {

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
  
  sqlQuery(query, callback)
  
}

const postNotes = (insert_json_data, callback) => {
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

  sqlQuery(query, callback)

}

const getNoteTypes = (callback) => {
  const query = 'SELECT * FROM note_type'
  sqlQuery(query, callback)
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

const getWeights = (cat_id, callback) => {
  const query = _getWeightsQuery(cat_id)
  sqlQuery(query, callback)
}

const addWeights = async (cat_id, weightsData, callback) => {
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
  
  try {
    await pool.promise().query(query)
  } catch (err) {
    //conn.release()
    console.log(err)
    callback(true, {msg: "Error inserting weight(s) into DB"})
    return
  }
  
  try {
    [rows, ] = await pool.promise().query(_getWeightsQuery())
    //conn.release()
    //console.log(rows)
    callback(false, rows) // res = new weights
  } catch (err) {
    //conn.release()
    console.log(err)
    callback(true, {msg: "Error fetching new weight(s) from DB"})
  }
}

module.exports = {
  addWeights,
  getCats,
  getFoods,
  getNotes,
  getNoteTypes,
  getWeights,
  postNotes,
}