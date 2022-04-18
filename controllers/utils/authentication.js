const jwt = require('jsonwebtoken')

const authenticateUser = request => {
  const token = _getTokenFromAuthorization(request)
  if (!token) {
    return [true, {msg: 'Missing token'}]
  }

  const decodedToken = jwt.verify(token, process.env.SECRET)
  console.log('decodedToken:', decodedToken)
  if (!decodedToken.id) {
    return [true, {msg: 'Invalid token'}]
  }

  return [false, decodedToken.id] // User ID
}

const _getTokenFromAuthorization = request => {
  // Assume token in Authorization Header:
  // e.g. Bearer eyJhbGciOiJIUzI1NiIsInR5c2VybmFtZSI6Im1sdXVra2FpIiwiaW
  const authorization = request.get('authorization')
  console.log('authorization: ', authorization)
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    console.log('token: ', authorization.substring(7))
    return authorization.substring(7)
  }
  return null
}


module.exports = {
  authenticateUser
}