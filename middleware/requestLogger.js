const requestLogger = (request, response, next) => {
  console.log('---requestLogger---')
  console.log('Timestamp: ', (new Date()).toISOString())
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Headers:  ', request.headers)
  console.log('Body:  ', request.body)
  console.log('-------------------')
  next()
}

module.exports = requestLogger