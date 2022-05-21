const errors = require('./utils/errors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const BaseService = require('./base')
const SALT_ROUNDS = 10

const dao = require('../data_handlers/dao_sql')
class UserService extends BaseService {

  async testQuery(callback) {
    const [err, data] = await dao.testQuery()
    callback(data)
  }

  async registerUser(email, password, callback) {

    const [err, nRows] = await dao.checkIfEmailExists(email)

    if (err) {
      throw new errors.DatabaseError(
        'Error checking email in DB',
        err
      )
    }

    // Check if user already exists
    if (nRows > 0) {
      throw new errors.UserAlreadyExistsError(
        'User already exists',
        null
      )
    }

    const password_hash = bcrypt.hashSync(password, SALT_ROUNDS)
    const [insertErr, user_id] = await dao.insertUser(email, password_hash)

    if (insertErr) {
      throw new errors.RegistrationError(
        'Error when trying to add user to DB',
        insertErr
      )
    }

    callback({
      user_id,
      email
    })
  }

  async loginUser(email, password, callback) {
    const [err, usersWithEmail] = await dao.getUserCredentials(email)

    if (err) {
      throw new errors.DatabaseError(
        'Error getting user from the DB',
        err
      )
    }

    if (usersWithEmail.length === 0) {
      throw new errors.UserDoesNotExistError(
        `User with email ${email} does not exist`,
        null
      )
    }

    if (!bcrypt.compareSync(
      password,
      usersWithEmail[0].password_hash,
    )) {
      throw new errors.IncorrectPasswordError(
        'Incorrect password',
        null
      )
    }

    const userForToken = {
      email: email,
      id: usersWithEmail[0].id,
    }

    console.log('userForToken:', userForToken)
    const token = jwt.sign(userForToken, process.env.SECRET)
    callback({email, token, user_id: usersWithEmail[0].id})
  }

  async linkSlackUser(userId, slackUserId) {
    const rows = await this.daoRequest(
      'getSlackUsers',
      [],
      'Error getting slack users from the DB'
    )
    const linkedSlackIds = rows.map(r => r["slack_user_id"])
    if (linkedSlackIds.includes(slackUserId)) {
      throw new errors.DuplicateDataError(
        `Slack ID ${slackUserId} already linked`,
        null
      )
    }
    // Expiry one hour after now
    const verificationExpiry = new Date(Date.now() + 60*60000) //new Date(curDatetime.getTime() + 10*60000)
    const verificationCode = this.genVerificationCode()
    const verificationCodeHash = bcrypt.hashSync(verificationCode, SALT_ROUNDS)

    await this.daoRequest(
      'insertSlackUser',
      [userId, slackUserId, verificationCodeHash, verificationExpiry.toISOString()],
      'Error inserting slack user into the DB'
    )

    return [verificationCode, verificationExpiry.toISOString()]

  }

  async getSlackUserLink(slackUserId) {
    return await this.daoRequest(
      'getSlackUser',
      [slackUserId],
      'Error getting slack user from the DB',
    )
  }

  async verifySlackUserLink(slackUserId, accountEmail, verificationCode) {
    const curDatetime = Date.now()

    const slackUserRow = await this.getSlackUserLink(slackUserId)

    console.log(slackUserRow)
    if (slackUserRow.length === 0) {
      throw new errors.BadRequest("No slack user linked to this account")
    }
  }

  async getUserIdByEmail(email) {
    const [err, usersWithEmail] = await dao.getUserCredentials(email)

    if (err) {
      throw new errors.DatabaseError(
        'Error getting user from the DB',
        err
      )
    }

    if (usersWithEmail.length === 0) {
      throw new errors.UserDoesNotExistError(
        `User with email ${email} does not exist`,
        null
      )
    }

    return usersWithEmail[0].id
  }

  genVerificationCode() {
    var text = ""
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for (var i = 0; i < 6; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length))

    return text
  }
}

module.exports = UserService
/*
const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';
To hash a password:
Technique 1 (generate a salt and hash on separate function calls):

const salt = bcrypt.genSaltSync(saltRounds);
const hash = bcrypt.hashSync(myPlaintextPassword, salt);
// Store hash in your password DB.
Technique 2 (auto-gen a salt and hash):

const hash = bcrypt.hashSync(myPlaintextPassword, saltRounds);
*/