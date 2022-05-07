const slackRouter = require('express').Router()
// let slackService
let userService, catService, weightService
const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')
const axios = require('axios')
const { read } = require('fs')
const crypto = require('crypto')

const SLASH_TAGS = {
  LINK_SLACK: "link-slack",
}

// VC TODO - convert to middleware
const verifySignature = (req, res, next) => {
  const signature = req.headers['x-slack-signature']
  const timestamp = req.headers['x-slack-request-timestamp']
  const hmac = crypto.createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
  const [version, hash] = signature.split('=')

  hmac.update(`${version}:${timestamp}:${req.rawBody}`)

  req.slackSignatureValid = hmac.digest('hex') === hash

  next()
}

slackRouter.use(verifySignature)

slackRouter.post(
  '/interaction/',
  async (req, res, next) => {
    console.log('In /interaction/')
    const payload = JSON.parse(req.body.payload)

    console.log(`payload = ${JSON.stringify(payload, null, 2)}`)

    const interactionType = payload.type
    console.log(`interaction type = ${interactionType}`)
    if (interactionType === "view_submission") {
      const view = payload.view
      console.log(`private metadata = ${payload.view.private_metadata}`)
      const privateMetadata = JSON.parse(payload.view.private_metadata)

      if (privateMetadata.slash_tag === SLASH_TAGS.LINK_SLACK) {
        const code = view.state.values.link_slack_input.link_slack_code.value
        console.log(`code = ${code}`)
        console.log(`channel ID = ${privateMetadata.channel_id}`)
        res.send()
        return
      }
    }

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
// slackRouter.post(
//   '/validate-link/',
//   async (req, res, next) => {
//     const slackTimestamp = req.headers['X-Slack-Request-Timestamp']
//     const currentTimestamp = Date.now()/1000
//   }
// )

// Available commands:
// * link
// * unlink
// * add-weight

slackRouter.post(
  '/slash-command/',
  async (req, res, next) => {
    const text = req.body.text
    const textArr = text.split()
    const command = textArr[0]
    if (command === '') {
      return res.json(
        {
          response_type: "in_channel",
          text: "No command sent",
        }
      )
    }

    const triggerId = req.body.trigger_id
    const channel_id = req.body.channel_id
    // headers: {
    //   'Content-Type': 'application/json; charset=UTF-8',
    //   Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
    // },

    if (command === "link") {
      // VC TODO - first check if user triggered link from app recently
      res.json({
        response_type: "in_channel",
        text: "command link should trigger modal",
      })

      const modalRes = await axios.post(
        "https://slack.com/api/views.open",
        {
          "trigger_id": triggerId,
          "view": {
            "type": "modal",
            "callback_id": "verification-modal",
            "title": {
              "type": "plain_text",
              "text": "Link to SoluNala app"
            },
            "submit": {
              "type": "plain_text",
              "text": "Submit"
            },
            "private_metadata": JSON.stringify({
              slash_type: SLASH_TAGS.LINK_SLACK,
              channel_id,
            }),
            "blocks": [
              {
                "type": "section",
                "block_id": "link_slack_instruction",
                "text": {
                  "type": "mrkdwn",
                  // "text": "*Welcome* to ~my~ Block Kit _modal_!"
                  "text": "Please enter the 6 digit verificiation code"
                },
                // "accessory": {
                //   "type": "button",
                //   "text": {
                //     "type": "plain_text",
                //     "text": "Submit"
                //   },
                //   "action_id": "button-identifier"
                // }
              },
              {
                "type": "input",
                "block_id": "link_slack_input",
                "label": {
                  "type": "plain_text",
                  "text": "Code"
                },
                "element": {
                  "type": "plain_text_input",
                  "action_id": "link_slack_code",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "e.g. 123456"
                  }
                }
              }
            ]
          }
        },
        {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
          }
        }
      )
      console.log(`modalRes.status= ${modalRes.status}`)
      console.log(`modalRes.data= ${JSON.stringify(modalRes.data)}`)
      return

      // return res.json({
      //   response_type: "in_channel",
      //   text: "command link should have triggered modal",
      // })
    }

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

    return res.json({
      response_type: "in_channel",
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
            text: `text: ${text}`
          }
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `trigger_id: ${triggerId}`
          }
        },
      ]
    })
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
            text: `Slack signature valid: ${req.slackSignatureValid}`
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