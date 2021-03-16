require('dotenv').config()
const mysql = require('mysql2')
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

  async syncQuery(sqlQuery) {
    console.log('sqlQuery', sqlQuery)

    try {
      const [rows, fields] = await this.promisifiedQuery(sqlQuery)
      //const [rows, fields] = await this.promisifiedQuery(sqlQuery)
      console.log([false, rows, fields])
      return [false, rows, fields]
    } catch (err) {
      return [err, null, null]
    }
  }

  promisifiedQuery(sqlQuery) {
    return this.pool.promise().query(sqlQuery)
  }
}

module.exports.MySqlPool = MySqlPool

