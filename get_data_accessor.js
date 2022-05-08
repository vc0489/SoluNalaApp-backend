// Pattern based on https://stackoverflow.com/questions/38747875/how-to-share-connection-pool-between-modules-in-node-js

const MySqlPool = require('./db_connectors/MySqlPool')
const PostgresPool = require('./db_connectors/Postgres')

let pool_obj
const db_schema = process.env.DB_SCHEMA

module.exports = {
  getPool: () => {
    if (pool_obj) {
      // if it is already there, grab it here
      console.log('Grabbing existing pool')
      return pool_obj
    } else {
      //const pool = new MySqlPool()
      pool_obj = new PostgresPool(db_schema)
      console.log(`Created new pool with schema ${db_schema}`)
      return pool_obj
    }
  }
}