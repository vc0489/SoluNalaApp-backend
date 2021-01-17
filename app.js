require('dotenv').config()

const mysql = require('mysql')
const express = require('express')
const cors = require('cors')
const moment = require('moment')

const app = express()

//const Person = require('./models/person')

//app.use(express.static('build'))
app.use(cors())
app.use(express.json())


//const morgan = require('morgan')
//morgan.token('content', (request) => {
//  return JSON.stringify(request.body)
//})
//app.use(morgan(':method :url :status :res[content-length] - :response-time ms :content'))

const format_datetime_to_date = (datetime) => moment(datetime).format('YYYY-MM-DD')

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

app.get('/', (request, response) => {
  response.send('<h1>Welcome to SoluNala World!</h1>')
})

app.get('/api/v1/cats', (req, res, next) => {
  const query = 'SELECT * FROM cat ORDER BY birthdate ASC'
  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err
    //res.send(JSON.stringify({"status": 200, "error": null, "response": rows}))
    console.log(rows)
    const output_rows = rows.map(row => {
      return ({
        id: row.id,
        name: row.cat_name,
        birthdate: format_datetime_to_date(row.birthdate),
        breed: row.breed,
        colour: row.colour
      })
    })
    res.json(output_rows)
  })
})

const transformWeights = (rows) => {
  return rows.map(row => {
    return ({
      cat_id: row.cat_id,
      grams: row.grams,
      date: format_datetime_to_date(row.weigh_date)
    })
  })
}

const transformNotes = (rows) => {
  return rows.map(row => {
    return ({
      ...row,
      date: format_datetime_to_date(row.date)
    })
  })
}

// TODO - order by increasing date
// Latest entry per cat+date
app.get('/api/v1/weights', (req, res, next) => {
  const cat_id = req.query.cat_id
  console.log('cat_id=' + cat_id)
  
  let query
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
  
  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err
    console.log(rows)
    res.json(transformWeights(rows))
  })
})

app.post('/api/v1/weights', (req, res, next) => {
  const body = req.body
  
  console.log(body)
  if (!body.cat_id || !body.grams || !body.date) {
    return res.status(400).json({
      error: 'cat_id or grams or date missing'
    })
  }
  
  //TODO - use this to generate query
  const toInsert = {
    cat_id: body.cat_id,
    grams: body.grams,
    weigh_date: body.date,
  }

  query = mysql.format(
    'INSERT INTO daily_weight (cat_id, grams, weigh_date) VALUES (?,?,?)',
    [body.cat_id, body.grams, body.date]
  )

  res.locals.connection.query(query, (err, query_res) => {
    if (err) throw err
    console.log('Inserted weight')
    console.log('query_res:', query_res)
    res.json(body)
  })
})

app.get('/api/v1/weights/:id', (req, res, next) => {
  const query = mysql.format('SELECT * FROM daily_weight WHERE id = ?', [req.params.id])

  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err
    console.log(rows)
    res.json(transformWeights(rows))
  })
})

app.get('/api/v1/note_types', (req, res, next) => {
  const query = 'SELECT * FROM note_type'
  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err

    console.log(rows)
    const output_rows = rows.map(row => {
      return ({
        id: row.id,
        description: row.type_description,
      })
    })
    res.json(output_rows)
  })
})

app.get('/api/v1/notes', (req, res, next) => {
  const cat_id = req.query.cat_id
  const note_type_id = req.query.note_type_id
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
  
  res.locals.connection.query(query, (err, rows, fields) => {
    if (err) throw err
    console.log(rows)
    res.json(transformNotes(rows))
  })
})

app.post('/api/v1/notes', (req, res, next) => {
  const body = req.body
  console.log('in POST /api/v1/notes')
  console.log(body)
  
  
  if (!body[0].cat_id || !body[0].note_type_id || !body[0].date || !body[0].content ) {
    return res.status(400).json({
      error: 'cat_id, note_type_id, date or content missing'
    })
  }
  
  insert_data = body.map(note => [note.cat_id, note.note_type_id, note.date, note.time, note.content])
  query = mysql.format(
    'INSERT INTO note (cat_id, note_type_id, note_date, note_time, content) VALUES ?',
    [insert_data]
  )
  

  res.locals.connection.query(query, (err, query_res) => {
    if (err) throw err
    console.log('Inserted note(s)')
    console.log('query_res:', query_res)
    res.json(body)
  })

  /*
  //TODO - use this to generate request
  const toInsert = {
    cat_id: body.cat_id,
    note_type_id: body.note_type_id,
    note_date: body.date,
    content: body.content
  }
  query = mysql.format(
    'INSERT INTO note (cat_id, note_type_id, note_date, content) VALUES (?,?,?,?)',
    [body.cat_id, body.note_type_id, body.date, body.content]
  )

  res.locals.connection.query(query, (err, query_res) => {
    if (err) throw err
    console.log('Inserted note')
    console.log('query_res:', query_res)
    res.json()
  })
  */
})

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

app.get('/')
const unknownEndPoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndPoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

/*

app.get('/info', (request, response) => {
  Person.countDocuments({}).then(count => {
    let d = new Date()
    let msg = `<p>Phonebook has info for ${count} people</p><p>${d.toString()}</p>`
    response.send(msg)
  })
})


app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      response.json(person)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => {
      response.status(204).end()
    })
    .catch(error => next(error))
})



app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number)  {
    return response.status(400).json({
      error: 'name or number missing'
    })
  }
  
  const person = new Person({
    name: body.name,
    number: body.number,
  })

  person.save()
    .then(savedPerson => {
      response.json(savedPerson)
    })
    .catch(error => {
      console.log(error.name)
      console.log(error)
      return next(error)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
  const body = request.body

  const person = {
    name: body.name,
    number: body.number,
  }

  Person.findByIdAndUpdate(request.params.id, person, { new: true })
    .then(updatedPerson => {
      response.json(updatedPerson)
    })
    .catch(error => next(error))
})


*/

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
