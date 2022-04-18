require('dotenv').config()

const mysql = require('mysql2/promise')

// For connection pool
// https://dev.to/gduple/pool-party-mysql-pool-connections-in-node-js-3om7
// const poolConnection = pool.promise() // Use this to keep to one connection

class MySqlPool {
  constructor(connectionLimit=5) {
    this.pool = mysql.createPool({
      host: process.env.AWS_DB_HOST,
      user: process.env.AWS_DB_USERNAME,
      password: process.env.AWS_DB_PASSWORD,
      database: process.env.AWS_DB_NAME,
      connectionLimit: connectionLimit
    })
  }

  query(sqlQuery, callback) {
    // Single SQL query
    this.pool.query(sqlQuery, (err, rows, fields) => {
        callback(err, rows, fields)
    })
  }

  async syncExecute(sqlQuery, payload) {
    console.log('---syncExecute---')
    console.log('sqlQuery: ', sqlQuery)
    console.log('payload: ', payload)
    

    try {
      const [rows, fields] = await this._promisifiedExecute(sqlQuery, payload)
      console.log('rows: ', rows)
      console.log('-----------------')
      return [false, rows, fields]
    } catch(err) {
      console.log('err: ', err)
      console.log('-----------------')
      return [err, null, null]
    }
    
  }

  async syncQuery(sqlQuery, payload = null) {
    const conn = await this.pool.getConnection()

    console.log('---syncQuery---')
    console.log('sqlQuery: ', sqlQuery)
    console.log('payload: ', payload)

    try {
      const [rows, fields] = await this._promisifiedQuery(sqlQuery, payload)
      console.log('rows: ', rows)
      console.log('-----------------')
      return [false, rows, fields]
    } catch (err) {
      console.log('err: ', err)
      console.log('-----------------')
      return [err, null, null]
    }
  }

  _promisifiedQuery(sqlQuery, payload) {
    if (!payload) {
      //return this.pool.promise().query(sqlQuery)
      return this.pool.query(sqlQuery)
    } else {
      //return this.pool.promise().query(sqlQuery, payload)
      return this.pool.query(sqlQuery, payload)
    }
  }

  _promisifiedExecute(sqlQuery, values) {
    //return this.pool.promise().execute(sqlQuery, values)
    return this.pool.execute(sqlQuery, values)
  }

  async transaction(sqlQueries) {
    console.log('---Start transaction---')
    const conn = await this.pool.getConnection()
    await conn.beginTransaction()
    const allRows = []

    try {
      let rows, fields //query, vals
      for (let [i, [query, values]] of sqlQueries.entries()) {
        [rows, fields] = await conn.query(query, values)
        console.log(`->Query ${i+1}`)
        console.log('-->SQL:', query)
        console.log('-->values:', values)
        allRows.push(rows)
      }
    } catch (err) {
      console.log('-->Error:', err)
      await conn.rollback()
      await conn.release()
      return [err, allRows, null]
    }
    await conn.commit()
    await conn.release()
    return [false, allRows, null]
  }
}

module.exports = MySqlPool