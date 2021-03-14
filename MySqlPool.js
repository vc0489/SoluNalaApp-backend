require('dotenv').config()
const mysql = require('mysql2')

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
    // [1] Get connection from pool
    // [2] Run query
    // [3] Return results
    this.pool.query(sqlQuery, (err, rows, fields) => {
        callback(err, rows, fields)
    })
    
  }

  async syncQuery(sqlQuery) {
    console.log(sqlQuery)
    try {
      const output = await this.pool.promise().query(sqlQuery)
      console.log(output)
    } catch (err) {
      console.log('err:', err)
    }
    
    try {
      const [rows, fields] = await this.pool.promise().query(sqlQuery)
      //const [rows, fields] = await this.promisifiedQuery(sqlQuery)
      return [false, rows, fields]
    } catch (err) {
      return [err, null, null]
    }
  }

  promisifiedQuery(sqlQuery) {
    return this.pool.promise().query(sqlQuery)
  }

  //syncQueries(sqlQueries, callback) {
  //  console.log('Not implmented yet.')
  //}
}

module.exports.MySqlPool = MySqlPool

