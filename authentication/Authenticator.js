const jwt = require('jsonwebtoken')

class Authenticator {
  constructor(dataAccessor) {
    this.dataAccessor = dataAccessor
  }

  // request -> user ID
  authenticateUser(request) {
    const token = this._getTokenFromAuthorization(request)
    if (!token) {
      return [true, {msg: 'Missing token', code: 401}]
    }

    let decodedToken
    try {
      decodedToken = jwt.verify(token, process.env.SECRET)
      console.log('decodedToken:', decodedToken)
    } catch(err) {
      return [true, {msg: 'Invalid token', code: 401}]
    }
    if (!decodedToken.id) {
      return [true, {msg: 'Invalid token', code: 401}]
    }

    return [false, decodedToken.id] // User ID
  }

  async checkCatBelongsToUser(request, cat_id) {
    const [authErr, authRes] = this.authenticateUser(request)
    if (authErr) {
      return [true, authRes]
    }

    let userCats
    try {
      userCats = await this.getUserCats(authRes) // authRes = UserID
    } catch(err) {
      return [true, {msg: 'Server error getting user cats', code: 500}]
    }

    if (userCats.includes(cat_id)) {
      return [false, true]
    } else {
      return [false, false]
    }
  }

  async userCatsFromRequest(request) {
    const [authErr, authRes] = this.authenticateUser(request)
    if (authErr) {
      return [true, authRes]
    }

    let userCats
    try {
      userCats = await this.getUserCats(authRes) // authRes = UserID
    } catch(err) {
      return [true, {msg: 'Server error getting user cats', code: 500}]
    }

    return [false, userCats]
  }

  async getUserCats(userId) {
    const [err, data] = await this.dataAccessor.getUserCats(userId)
    return data.map(cat => cat.id)
  }

  _getTokenFromAuthorization(request) {
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
}

module.exports = Authenticator

/*
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
*/