require('dotenv').config()

const { Pool } = require('pg')
const { flatten, toTuple } = require('pg-parameterize')
const fs = require('fs')
// conn = psycopg2.connect(
//   host=os.getenv("COCKROACHDB_HOST"),
//   port=os.getenv("COCKROACHDB_PORT"),
//   # dbname=os.getenv("COCKROACH_DB") + "." + os.getenv("COCKROACH_DB"),
//   dbname=".".join([
//     os.getenv("COCKROACHDB_CLUSTER"),
//     os.getenv("COCKROACHDB_DBNAME")
//   ]),
//   user=os.getenv("COCKROACHDB_USER"),
//   password=os.getenv("COCKROACH_PASSWORD"),
//   sslmode="verify-full",
//   sslrootcert="/Users/vhc08/.postgresql/root.crt",
// )
class PostgresPool {

  constructor(schema = 'sandbox') {
    // const config = {
    //   connectionString: "postgresql://vincent:qaNiZX_aE3DD2P_e@free-tier5.gcp-europe-west1.cockroachlabs.cloud:26257/solunaladb?sslmode=verify-full&sslrootcert=/Users/vhc08/.postgresql/root.crt&options=--cluster%3Dsolunala-1683"
    // }
    console.log(`PostgresPool constructor: schema=${schema}`)
    const config = {
      user: process.env.COCKROACHDB_USER,
      host: process.env.COCKROACHDB_HOST,
      database: process.env.COCKROACHDB_CLUSTER + '.' + process.env.COCKROACHDB_DBNAME,
      port: process.env.COCKROACHDB_PORT,
      password: process.env.COCKROACHDB_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
        // ca: fs.readFileSync(process.env.HOME + '/.postgresql/root.crt').toString(),
        ca: fs.readFileSync('certs/root.crt').toString(),
      },
      // sslmode="verify-full",
      // sslrootcert="/Users/vhc08/.postgresql/root.crt",
      options: `-c search_path=${schema}`,
    }

    console.log(config)
    this.pool = new Pool(config)
  }

  formatPlaceholdersWithPayload(query, payload) {
    if (payload === null) {
      return [query, []]
    }

    if (payload.length === 0) {
      return [query, payload]
    }
    if (!Array.isArray(payload[0])) {
      return [this.formatPlaceholders(query), payload]
    }

    const placeholders = toTuple(payload[0], false)
    query = this._formatSinglePlaceholder(query, placeholders)
    query = this.formatPlaceholders(query)
    payload = flatten(payload[0])
    return [query, payload]
  }

  formatPlaceholders(query) {
    let placeholder_no = 1

    while (true) {
      if (!query.includes('?')) {
        break
      }
      query = this._formatSinglePlaceholder(query, '$' + placeholder_no)
      placeholder_no = placeholder_no + 1
    }
    return query
  }

  _formatSinglePlaceholder(query, replace_with) {
    const placeholder_idx = query.indexOf('?')
    if (placeholder_idx === -1) {
      return query
    }
    query = [
      query.slice(0, placeholder_idx),
      replace_with,
      query.slice(placeholder_idx+1)
    ].join('')

    return query
  }

  query(sqlQuery, callback) {
    // Single SQL query
    this.pool.query(sqlQuery, (err, rows, fields) => {
        callback(err, rows, fields)
    })
  }

  async syncExecute(sqlQuery, payload) {
    return await this.syncQuery(sqlQuery, payload)
  }

  async syncQuery(sqlQuery, payload = null) {
    //const conn = await this.pool.connect()

    console.log('---syncQuery---')
    console.log('sqlQuery: ', sqlQuery)
    console.log('payload: ', payload)

    let [formattedSqlQuery, formattedPayload] = this.formatPlaceholdersWithPayload(sqlQuery, payload)
    console.log('formatted sqlQuery: ', formattedSqlQuery)

    if (formattedSqlQuery.includes("INSERT")) {
      formattedSqlQuery = formattedSqlQuery + ' RETURNING *'
    }
    try {
      const res = await this.pool.query(formattedSqlQuery, formattedPayload)
      const rows = res.rows
      const fields = res.fields
      console.log('rows: ', rows)
      console.log('-----------------')
      return [false, rows, fields]
    } catch (err) {
      console.log('err: ', err)
      console.log('-----------------')
      return [err, null, null]
    }

    try {
      const [rows, fields] = await this._promisifiedQuery(sqlQuery, payload)
      console.log('rows: ', rows)
      console.log('-----------------')
      return [false, rows, fields]
    } catch (err) {
      console.log('err: ', err)
      console.log('-----------------')
      return [err, null, null]
    } finally {
      conn.release()
    }
  }

  async _promisifiedQuery(sqlQuery, payload) {
    const res = await this.pool.query(sqlQuery, payload)
    console.log(res)
    return res

    if (!payload) {
      //return this.pool.promise().query(sqlQuery)
      return this.pool.query(sqlQuery)
    } else {
      sqlQuery = this.formatPlaceholders(sqlQuery)
      //return this.pool.promise().query(sqlQuery, payload)
      return this.pool.query(sqlQuery, payload)
    }
  }

  _promisifiedExecute(sqlQuery, values) {
    //return this.pool.promise().execute(sqlQuery, values)
    sqlQuery = this.formatPlaceholders(sqlQuery)
    return this.pool.query(sqlQuery, values)
  }

  async transaction(sqlQueries) {
    console.log('---Start transaction---')
    const conn = await this.pool.connect()

    try {
      await conn.query('BEGIN')
      const allRows = []

      for (let [i, [query, values]] of sqlQueries.entries()) {
        let [formattedSqlQuery, formattedPayload] = this.formatPlaceholdersWithPayload(
          query, values
        )
        if (formattedSqlQuery.includes("INSERT")) {
          formattedSqlQuery = formattedSqlQuery + ' RETURNING *'
        }
        console.log(`->Query ${i+1}`)
        console.log('-->SQL:', formattedSqlQuery)
        console.log('-->values:', formattedPayload)
        const res = await conn.query(formattedSqlQuery, formattedPayload)
        allRows.push(res.rows)
      }
      await conn.query('COMMIT')
      conn.release()
      return [false, allRows, null]
    } catch (err) {
      console.log('-->Error:', err)
      await conn.query('ROLLBACK')
      conn.release()
      return [err, allRows, null]
    }
  }
}

module.exports = PostgresPool