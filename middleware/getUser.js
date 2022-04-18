const jwt = require('jsonwebtoken')

const getUser = (request, response, next) => {
  const token = _getTokenFromAuthorization(request)
  request.user_id = undefined

  if (!token) {
    request.valid_token = undefined
    console.log('no token')
    return next()
  }

  // If invalid token respond immediately with error
  let decodedToken
  try {
    decodedToken = jwt.verify(token, process.env.SECRET)
    console.log('decodedToken:', decodedToken)
  } catch(err) {
    request.valid_token = false
    return next({
      error_type: 'JsonWebTokenError',
      msg: 'Invalid token'
    })
  }

  if (!('id' in decodedToken)) {
    request.valid_token = false
    return next({
      error_type: 'JsonWebTokenError',
      msg: 'Invalid token (missing id)'
    })
  }

  request.valid_token = true
  request.user_id = decodedToken.id
  next()
}

const logUser = (request, response, next) => {
  console.log('valid_token:  ', request.valid_token)
  console.log('user_id:  ', request.user_id)
  console.log('---')
  next()
}

_getTokenFromAuthorization = request => {
  // Assume token in Authorization Header:
  // e.g. Bearer eyJhbGciOiJIUzI1NiIsInR5c2VybmFtZSI6Im1sdXVra2FpIiwiaW
  const authorization = request.get('authorization')
  //console.log('authorization: ', authorization)
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    console.log('token: ', authorization.split(' ')[1])
    return authorization.split(' ')[1]
  }
  return null
}

module.exports = {
  getUser,
  logUser
}