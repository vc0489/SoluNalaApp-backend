const csv = require('csvtojson')

const csvBufferToJson = field_name => {
  return async (request, response, next) => {
    console.log('---csvBufferToJson---')
    try {
      const data = await csv().fromString(request.file.buffer.toString())
      console.log('CSV data:  ', data)
      request.body[field_name] = data
      console.log('----------------------')
      next()
    } catch (e) {
      next({
        msg: 'Could not convert CSV buffer to JSON',
        error_type: 'Server'
      })
      return
    }
  }
}

module.exports = csvBufferToJson