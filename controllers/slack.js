const slackRouter = require('express').Router()
const UserService = require('../services/users')
const userService = new UserService()

const CatService = require('../services/cats')
const catService = new CatService()

const WeightService = require('../services/weights')
const weightService = new WeightService()

const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')
const axios = require('axios')
const { read } = require('fs')
const crypto = require('crypto')

const errors = require('../services/utils/errors')

const SLASH_TAGS = {
  LINK_SLACK: "link-slack",
  ADD_WEIGHT: "add-weight",
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

      if (privateMetadata.slash_type === SLASH_TAGS.ADD_WEIGHT) {
          const catId = view.state.values.add_weight_select_cat.select_cat_action.selected_option?.value
          const weighDate = view.state.values.add_weight_select_date.add_weight_date.selected_date
          const grams = parseInt(Number(view.state.values.add_weight_input_weight.add_weight_grams.value))

          const errorsBlock = {}
          if (!grams) {
            errorsBlock['add_weight_input_weight'] = 'Invalid weight. Please enter a number.'
          }

          // VC TODO
          // Check if weight already exists in DB
          // Add override option to modal
          const slackId = payload.user.id
          const slackUserRow = await userService.getSlackUserLinkAndEmail(slackId)
          console.log(`slackId = ${slackId}`)
          console.log(`userId = ${slackUserRow[0].user_id}`)
          console.log(`catId = ${catId}`)
          console.log(`weighDate = ${weighDate}`)
          console.log(`grams = ${grams}`)
          console.log(`userId = ${slackUserRow[0].user_id}`)
          // const userWeights = await weightService.getWeights(payload.userId)

          if (Object.keys(errorsBlock).length) {
            res.json({
              'response_action': 'errors',
              'errors': errorsBlock,
            })
            return
          }
          res.send()
          // VC TODO
          // - Add weight to DB
          // - Post slack message if successful
          return
      }

      if (privateMetadata.slash_type === SLASH_TAGS.LINK_SLACK) {
        const email = view.state.values.link_slack_email_block.link_slack_email.value
        const code = view.state.values.link_slack_code_block.link_slack_code.value
        const slackUserId = payload.user.id
        console.log(`email = ${email}`)
        console.log(`code = ${code}`)
        const verificationResults = await userService.verifySlackUserLink(
          slackUserId,
          email,
          code,
        )
        if (verificationResults['email'] && verificationResults['code']) {
          console.log('Slack link code verified!')
          res.send()
          return
        } else {
          const errorsBlock = {}
          if (!verificationResults['email']) {
            errorsBlock['link_slack_email_block'] = 'Incorrect email'
          }
          if (!verificationResults['code']) {
            errorsBlock['link_slack_code_block'] = 'Incorrect code'
          }
          res.json({
            'response_action': 'errors',
            'errors': errorsBlock,
          })
          return
        }
      }
    }

    return res.json({
      blocks: [
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
    console.log(`triggerId = ${triggerId}`)
    const channel_id = req.body.channel_id
    const slackUserId = req.body.user_id

    if (command === "add-weight") {
      // VC check if account linked first
      // -- Get cat names
      // -- Modal with
      // ----- Drop down of cat names
      // ----- Date picker
      // ----- Weight
      const slackUserRow = await userService.getSlackUserLinkAndEmail(slackUserId)
      if (slackUserRow.length !== 1) {
        res.json({
          response_type: "in_channel",
          text: "This Slack account is not linked to SoluNalaApp",
        })
        return
      }

      if (!slackUserRow[0].verified) {
        res.json({
          response_type: "in_channel",
          text: "This Slack account is not linked to SoluNalaApp",
        })
        return
      }

      const userCats = await catService.getCats(slackUserRow[0].user_id)
      const catNames = userCats.map(cat => cat.name)
      res.json({
        response_type: "in_channel",
        text: `Your cats: ${catNames}`,
      })
      const modalRes = await axios.post(
        "https://slack.com/api/views.open",
        {
          "trigger_id": triggerId,
          "view": {
            "type": "modal",
            "callback_id": "add-weight-modal",
            "title": {
              "type": "plain_text",
              "text": "Record cat weight"
            },
            "submit": {
              "type": "plain_text",
              "text": "Submit"
            },
            "private_metadata": JSON.stringify({
              slash_type: SLASH_TAGS.ADD_WEIGHT,
              channel_id,
            }),
            "blocks": [
              {
                "type": "section",
                "block_id": "add_weight_instruction",
                "text": {
                  "type": "mrkdwn",
                  // "text": "*Welcome* to ~my~ Block Kit _modal_!"
                  "text": "Record the weight of a cat for a chosen date"
                },
              },
              {
                "type": "input",
                "block_id": "add_weight_select_cat",
                "element": {
                  "type": "static_select",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select cat",
                  },
                  "options": userCats.map(cat => (
                    {
                      "text": {
                        "type": "plain_text",
                        "text": cat.name,
                        },
                      "value": cat.id
                    }
                  )),
                  "action_id": "select_cat_action"
                },
                "label": {
                  "type": "plain_text",
                  "text": "Cat",
                }
              },
              {
                "type": "input",
                "block_id": "add_weight_select_date",
                "element": {
                  "type": "datepicker",
                  // "initial_date": "1990-04-28",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "Select a date",
                  },
                  "action_id": "add_weight_date"
                },
                "label": {
                  "type": "plain_text",
                  "text": "Date",
                }
              },
              {
                "type": "input",
                "block_id": "add_weight_input_weight",
                "label": {
                  "type": "plain_text",
                  "text": "Weight in grams"
                },
                "element": {
                  "type": "plain_text_input",
                  "action_id": "add_weight_grams",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "e.g. 4500"
                  }
                }
              },
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
      return
    }

    if (command === "link") {
      const slackUserRow = await userService.getSlackUserLinkAndEmail(slackUserId)

      if (slackUserRow.length !== 1) {
        res.json({
          response_type: "in_channel",
          text: "A request to link this Slack account to SoluNalaApp has not been made recently.",
          // text: "This Slack account has not been linked to any SoluNala account.",
        })
        return
      }

      if (slackUserRow[0]['verified']) {
        res.json({
          response_type: "in_channel",
          text: "This Slack account is already linked to SoluNalaApp!",
        })
        return
      }

      const expiryTimestamp = new Date(slackUserRow[0]['verification_expiry'])
      if (Date.now() > expiryTimestamp.getTime()) {
        res.json({
          response_type: "in_channel",
          text: "A request to link this Slack account to SoluNalaApp has not been made recently.",
        })
        return
      }

      res.send()
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
                  "text": "Please enter the email registered to your SolunNalaApp account and the 6 character verificiation code"
                },
              },
              {
                "type": "input",
                "block_id": "link_slack_email_block",
                "label": {
                  "type": "plain_text",
                  "text": "Email"
                },
                "element": {
                  "type": "plain_text_input",
                  "action_id": "link_slack_email",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "e.g. abc@xyz.com"
                  }
                }
              },
              {
                "type": "input",
                "block_id": "link_slack_code_block",
                "label": {
                  "type": "plain_text",
                  "text": "Code"
                },
                "element": {
                  "type": "plain_text_input",
                  "action_id": "link_slack_code",
                  "placeholder": {
                    "type": "plain_text",
                    "text": "e.g. 1A9x3u"
                  }
                }
              },
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
  }
)


module.exports = slackRouter