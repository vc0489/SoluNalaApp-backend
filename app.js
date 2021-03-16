const express = require('express')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

// Get routers
const db_obj = require('./get_db').getPool()
const catsRouter = require('./controllers/cats')(db_obj)
const foodsRouter = require('./controllers/foods')(db_obj)
const weightsRouter = require('./controllers/weights')(db_obj)
const notesRouter = require('./controllers/notes')(db_obj)

// Add routers to app
const baseUrl = '/api/v1'
app.use(`${baseUrl}/cats`, catsRouter)
app.use(`${baseUrl}/foods`, foodsRouter)
app.use(`${baseUrl}/weights`, weightsRouter)
app.use(`${baseUrl}/notes`, notesRouter)

// Easter egg :P
app.get('/', (request, response) => {
  response.send('<h1>Welcome to SoluNala World!</h1>')
})

const unknownEndPoint = (req, res) => {
  res.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndPoint)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

// TODO - middleware to handle errors
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

