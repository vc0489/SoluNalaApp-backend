console.log(process.argv)
const db_schema = process.env.DB_SCHEMA
console.log(`DB Schema=${db_schema}`)
const node_env = process.env.NODE_ENV
console.log(`NODE_ENV=${node_env}`)
const express = require('express')
const errorTypeToCode = require('./controllers/utils/errorCodes')
const app = express()
app.use(express.json())

const cors = require('cors')
app.use(cors())

const requestLogger = require('./middleware/requestLogger')
app.use(requestLogger)

const { getUser, logUser} = require('./middleware/getUser')
app.use(getUser)
app.use(logUser)

const {
  dataAccessor, usersRouter, catsRouter, foodsRouter, weightsRouter, notesRouter
} = require('./get_routers')(db_schema)

// Add routers to app
const baseUrl = '/api/v1'
app.use(`${baseUrl}/users`, usersRouter)
app.use(`${baseUrl}/cats`, catsRouter)
app.use(`${baseUrl}/foods`, foodsRouter)
app.use(`${baseUrl}/weights`, weightsRouter)
app.use(`${baseUrl}/notes`, notesRouter)

// Easter egg :P
app.get('/', (request, response) => {
  response.send('<h1>Welcome to SoluNala World!</h1>')
})

const unknownEndPoint = (req, res) => {
  res.status(404).send({ msg: 'Unknown endpoint' })
}
app.use(unknownEndPoint)

// console.log(`PORT=${process.env.PORT}`)
// const PORT = process.env.PORT || 3001
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`)
// })

// TODO - middleware to handle errors, loggin etc.
const errorHandler = (error, request, response, next) => {
  console.log('---errorHandler---')
  console.log('error:  ', error)

  console.log('error.error_type:  ', error.error_type)
  console.log('error.msg:  ', error.msg)
  console.log('error.err:  ', error.err)
  if ('error_type' in error) {
    let error_code
    if ('error_code' in error) {
      error_code = error.error_code
    } else {
      error_code = errorTypeToCode(error.error_type)
    }

    let responseJson = {msg: error.msg}
    if (error.data) {
      responseJson = {...error.data, ...responseJson}
    }
    return response.status(error_code).json(responseJson)
  } else {
    return response.status(500).json({
      msg: 'Unknown server error'
    })
  }
  /*
  if (error.error_type === 'JsonWebTokenError') {
    return response.status(401).json({
      msg: error.msg
    })
  } else if (error.error_type === 'UnauthenticatedUser') {
    return response.status(401).json({
      msg: error.msg
    })
  }
  */


  //next(error)
}

app.use(errorHandler)

module.exports = {
  app,
  dataAccessor,
}

