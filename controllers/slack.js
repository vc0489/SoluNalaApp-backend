const slackRouter = require('express').Router()
let slackService
const { requireFieldsNotNull } = require('../middleware/bodyFieldValidator')
const axios = require('axios')
const { read } = require('fs')


// /addcatweight Luna 2022-04-25 4160

slackRouter.post(
  '/test/',
  async (req, res, next) => {

    console.log(`text: ${req.body.text}`)
    axios.get(
      'https://slack.com/api/users.info',
      {
        params: {
          user: req.body.user_id
        },
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`
        }
      }
    ).then(
      slack_res => {
        const email = slack_res.data.user.profile.email
        console.log(`email: ${email}`)
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

module.exports = () => slackRouter
// module.exports = _slackService => {
//   slackService = _slackService
//   return slackRouter
// }