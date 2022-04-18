const userRouter = require('express').Router()
let userService
const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')

userRouter.get(
  '/test/',
  async (req, res, next) => {
    userService.testQuery(data => {
      res.json(data)
    }).catch(e => {
      next(e)
    })
  }
)

userRouter.post(
  '/register/',
  requireFieldsNotNull(['email', 'password']),
  async (req, res, next) => {
    console.log('In register')
    //res.json({msg: 'In register'})
    userService.registerUser(req.body.email, req.body.password, userData => {
      res.json(userData) // user_id, email
    }).catch(e => {
      next(e)
    })
  }
)

userRouter.post(
  '/login/',
  requireFieldsNotNull(['email', 'password']),
  async (req, res, next) => {
    userService.loginUser(req.body.email, req.body.password, userData => {
      res.json(userData) // user_id, email, token
    }).catch(e => {
      next(e)
    })
  }
)

userRouter.get(
  '/health/',
  async (req, res, next) => {
    res.json({})
  }
)

module.exports = _userService => {
  userService = _userService
  return userRouter
}