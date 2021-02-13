//require('dotenv').config()

// For connection pool
// https://dev.to/gduple/pool-party-mysql-pool-connections-in-node-js-3om7
//const mysql = require('mysql')

const db = require('./db')
const transformers = require('./sql_output_transformers')

const express = require('express')
const cors = require('cors')
const moment = require('moment')

const app = express()
app.use(cors())
app.use(express.json())

// For CSV upload handling
const csv = require('csvtojson')
const multer = require('multer')
const memoryStorage = multer.memoryStorage()
const memUpload = multer({
  storage: memoryStorage,
  limit: { fileSize: 30 * 1024 * 2014, files: 1}
})

//const format_datetime_to_date = datetime => moment(datetime).format('YYYY-MM-DD')


const baseUrl = '/api/v1/'

app.get('/', (request, response) => {
  response.send('<h1>Welcome to SoluNala World!</h1>')
})

app.get(baseUrl + 'cats', (req, res, next) => {
  console.log('In /api/v1/cats')
  db.getCats((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getCats"})
      return
    }
    console.log(`In /api/v1/cats: rows=${JSON.stringify(rows)}`)
    res.json(transformers.transformCats(rows))
  })
})


// TODO - order by increasing date
// Latest entry per cat+date
app.get(baseUrl + 'weights', (req, res, next) => {
  const cat_id = req.query.cat_id || null
  console.log('cat_id=' + cat_id)
  
  db.getWeights(cat_id, (err, rows, fields) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights'
      })
    }
    //console.log(rows)
    res.json(transformers.transformWeights(rows))
  })

  
})

app.post(baseUrl + 'weight_file', memUpload.single('csvFile'), async (req, res) => {
  console.log(req.file.buffer)
  const cat_id = req.body.catID
  //console.log(req.files)
  const weightData = await csv().fromString(req.file.buffer.toString())
  console.log('cat_id:', cat_id, '; weightData:', weightData)

  const weightDataToInsert = weightData.map(data => {
    return ({
      grams: data.Weight,
      weigh_date: data.Date
    })
  })

  db.addWeights(cat_id, weightDataToInsert, (err, db_res) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + db_res
      })
    }

    res.json(transformers.transformWeights(db_res))
  })

})


app.post(baseUrl + 'weights', (req, res, next) => {
  const body = req.body
  
  console.log(body)
  if (!body.cat_id || !body.grams || !body.date) {
    return res.status(400).json({
      error: 'cat_id or grams or date missing'
    })
  }
  
  
  //TODO - use this to generate query
  const toInsert = [{
    grams: body.grams,
    weigh_date: body.date,
  }]

  db.addWeights(body.cat_id, toInsert, (err, db_res) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + db_res
      })
    }
    console.log(`In POST /api/v1/weights: db_res=${JSON.stringify(transformers.transformWeights(db_res))}`)
    res.json(transformers.transformWeights(db_res))
  })
  
})



app.get(baseUrl + 'note_types', (req, res, next) => {
  db.getNoteTypes((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNoteTypes"})
      return
    }
    const output_rows = rows.map(row => {
      return ({
        id: row.id,
        description: row.type_description,
      })
    })
    res.json(output_rows)

  })

})

app.get(baseUrl + 'notes', (req, res, next) => {
  const cat_id = req.query.cat_id || null
  const note_type_id = req.query.note_type_id || null
  
  db.getNotes(cat_id, note_type_id, (err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNotes"})
      return
    }
    res.json(transformers.transformNotes(rows))
  })
  
})

// TODO - refactor to db.js
app.post(baseUrl + 'notes', (req, res, next) => {
  const body = req.body
  console.log('in POST /api/v1/notes')
  console.log(body)
  
  
  if (!body[0].cat_id || !body[0].note_type_id || !body[0].date || !body[0].content ) {
    return res.status(400).json({
      error: 'cat_id, note_type_id, date or content missing'
    })
  }
  
  db.postNotes(
    body,
    (err, query_res) => {
      if (err) {
        res.status(500).json({error: "Server Error when calling db.postNote"})
        return
      }
      console.log('query_res:', query_res)
      console.log(`note id=${query_res.insertId}`)
      const addedNotes = body.map((note, index) => {
        return {...note, 'id': query_res.insertId+index}
      })
      res.json({result: 'Success', added_notes: addedNotes})
    }
  )
})


// TODO - refactor to db.js
/*
app.get('/api/v1/notes/:id', (req, res, next) => {
  
  const query = mysql.format(`
    SELECT
      note.id,
      note.note_date AS date,
      note.cat_id,
      note.note_type_id,
      note_type.type_description AS note_type,
      note.content
    FROM note
    LEFT JOIN note_type
    ON note.note_type_id=note_type.id
    WHERE note.id=?`, [req.params.id]
  )

  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err
    console.log(rows)
    res.json(rows)
  })
})
*/

app.get(baseUrl + 'foods', (req, res, next) => {
  db.getFoods((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getFoods"})
      return
    }
    console.log(`In ${baseUrl}foods: rows=${JSON.stringify(rows)}`)

    //const transformedFoods = transformers.transformFoods(rows)
    console.log('transformedFoods', transformers.transformFoods(rows))
    res.json(transformers.transformFoods(rows))
  })
})

const unknownEndPoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndPoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

/*
// Handle error
const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'MongoError') {
    return response.status(400).send({ error: 'name already exists in phonebook' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)
*/


// Decommissioned code

/* Old code to add connection to app local vars
app.use((req, res, next) => {
  res.locals.connection = mysql.createConnection({
    host: process.env.AWS_DB_HOST,
    user: process.env.AWS_DB_USERNAME,
    password: process.env.AWS_DB_PASSWORD,
    database: process.env.AWS_DB_NAME
  })
  res.locals.connection.connect()
  next()
})
*/
