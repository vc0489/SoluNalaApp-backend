const userRouter = require('express').Router()

const UserService = require('../services/users')
const userService = new UserService()

const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')
const checkUser = require('./../middleware/checkUser')

userRouter.post(
  '/slacktest/',
  async (req, res, next) => {
    res.json({
      "response_type": "in_channel",
      "text": JSON.stringify({
        "headers": req.headers,
        "body": req.body
      }),
  })
  }
)
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

userRouter.get(
  '/slackid/',
  checkUser,
  async (req, res, next) => {
    console.log('GET /slackid/')
  }
)

userRouter.post(
  '/slackid/',
  checkUser,
  requireFieldsNotNull(['slack_id']),
  async (req, res, next) => {
    try {
      const [verificationCode, verificationExpiry] = await userService.linkSlackUser(req.user_id, req.body.slack_id)
      res.status(201).send(
        {msg: `Slack user ID linked to account. Please enter verification code ${verificationCode} before ${verificationExpiry}`}
      )
    } catch (e) {
      next(e)
    }
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

module.exports = userRouter