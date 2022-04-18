const errors = require('./utils/errors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const BaseService = require('./base')
const SALT_ROUNDS = 10

class UserService extends BaseService {

  async testQuery(callback) {
    const [err, data] = await this.dataAccessor.testQuery()
    callback(data)
  }

  async registerUser(email, password, callback) {

    const [err, nRows] = await this.dataAccessor.checkIfEmailExists(email)

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
    const [insertErr, user_id] = await this.dataAccessor.insertUser(email, password_hash)

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
    const [err, usersWithEmail] = await this.dataAccessor.getUserCredentials(email)

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
      usersWithEmail[0].user_id
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