// Business logic here
const BaseService = require('./base')

class AuthenticationService extends BaseService{
  async getUserCats() {

  }
  
  async getUser(token) {
    const [err, data] = await this.dataAccessor.getCats()

    if (err) {
      callback(true, {msg: 'Error in getCats service', err: err})
    } else {
      callback(false, transformers.transformCats(data))
    }
  }
}

module.exports = CatService
