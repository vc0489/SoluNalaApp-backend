const slackRouter = require('express').Router()
// let slackService
let userService, catService, weightService
const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')
const axios = require('axios')
const { read } = require('fs')
const crypto = require('crypto')

// VC TODO - convert to middleware
const verifySignature = req => {
  const signature = req.headers['x-slack-signature']
  const timestamp = req.headers['x-slack-request-timestamp']
  const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
  const [version, hash] = signature.split('=')

  hmac.update(`${version}:${timestamp}:${req.rawBody}`)

  return hmac.digest('hex') === hash
}

slackRouter.post(
  '/interactive/',
  async (req, res, next) => {
    return res.json({
      blocks: [
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `email: ${email}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `Slack user ID: ${slackUserId}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `SoluNala user ID: ${userId}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `text: ${req.body.text}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `*Timestamps* slack: ${slackTimestamp}; app: ${currentTimestamp}; diff: ${currentTimestamp-slackTimestamp}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        // {
        //   type: 'section',
        //   text: {
        //     type: 'mrkdwn',
        //     text: `Slack signature verified: ${verifySignature(req)}`
        //   }
        // },
        // {
        //   type: 'divider',
        // },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Headers*: ${JSON.stringify(req.headers)}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Body:* ${JSON.stringify(req.body)}`
          }
        },
      ]
    })
  }
)
// /validate-account
slackRouter.post(
  '/validate-link/',
  async (req, res, next) => {
    const slackTimestamp = req.headers['X-Slack-Request-Timestamp']
    const currentTimestamp = Date.now()/1000
  }
)
// /addcatweight
// return list of cats
slackRouter.post(
  '/test/',
  async (req, res, next) => {

    console.log(`text: ${req.body.text}`)
    const slackRes = await axios.get(
      'https://slack.com/api/users.info',
      {
        params: {
          user: req.body.user_id
        },
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
        }
      }
    )
    const email = slackRes.data.user.profile.email
    const userId = await userService.getUserIdByEmail(email)
    const slackUserId = req.body.user_id

    const slackTimestamp = req.headers['x-slack-request-timestamp']
    const currentTimestamp = Date.now()/1000
    const sigBasestring = `v0:${slackTimestamp}:${req.rawBody}`


    // VC TODO check slackUserID is linked

    //console.log(`email: ${email}`)
    // Use email to load user
    // Get cat ID from cat name and user
    // Use cat ID, date and grams to add weight entry
    return res.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `email: ${email}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Slack user ID: ${slackUserId}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `SoluNala user ID: ${userId}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `text: ${req.body.text}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Timestamps* slack: ${slackTimestamp}; app: ${currentTimestamp}; diff: ${currentTimestamp-slackTimestamp}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Slack signature verified: ${verifySignature(req)}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `headers: ${JSON.stringify(req.headers)}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `body: ${JSON.stringify(req.body)}`
          }
        },
      ]
    })


    // axios.get(
    //   'https://slack.com/api/users.lookupByEmail',
    //   {
    //     params: {
    //       email: 'vc0489@gmail.com'
    //     },
    //     headers: {
    //       Authorization: 'Bearer xoxb-530987712531-3398917539462-QDAUoVctBlVLIMk3yq0hmUlG'
    //     }
    //   }
    // ).then(slack_res => res.json(slack_res.data))
    // res.json({
    //   "response_type": "in_channel",
    //   "text": JSON.stringify({
    //     "headers": req.headers,
    //     "body": req.body
    //   }),
    // })
  }
)

module.exports = (_userService, _catService, _weightService) => {
  userService = _userService
  catService = _catService
  weightService = _weightService
  return slackRouter
}
// module.exports = _slackService => {
//   slackService = _slackService
//   return slackRouter
// }