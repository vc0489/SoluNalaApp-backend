// Pattern based on https://stackoverflow.com/questions/38747875/how-to-share-connection-pool-between-modules-in-node-js

const MySqlPool = require('./db_connectors/MySqlPool')
const PostgresPool = require('./db_connectors/Postgres')
const SqlDataHandler = require('./data_handlers/SqlDataHandler')

let pool_obj

module.exports = {
  getPool: (schema) => {
    if (pool_obj) {
      // if it is already there, grab it here
      console.log('Grabbing existing pool')
      return pool_obj
    } else {
      //const pool = new MySqlPool()
      const pool = new PostgresPool(schema)
      pool_obj = new SqlDataHandler(pool)
      console.log('Creating new pool')
      return pool_obj
    }
  }
}