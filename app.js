const express = require('express')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

const { catsRouter, foodsRouter, weightsRouter, notesRouter } = require('./get_routers')
// Move below to setup script
// Data accessor
/*
const dataAccessor = require('./get_data_accessor').getPool() // data accessor object

const CatService = require('./services/cats')
const FoodService = require('./services/foods')
const NoteService = require('./services/notes')
const WeightService = require('./services/weights')

const catService = new CatService(dataAccessor)
const foodService = new FoodService(dataAccessor)
const noteService = new NoteService(dataAccessor)
const weightService = new WeightService(dataAccessor)

// Get routers
//const appService = require('./services/main')(dataAccessor)
const catsRouter = require('./controllers/cats')(catService)
const foodsRouter = require('./controllers/foods')(foodService)
const weightsRouter = require('./controllers/weights')(weightService)
const notesRouter = require('./controllers/notes')(noteService)
*/
//console.log(weightService)

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

// TODO - middleware to handle errors, loggin etc. 
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

