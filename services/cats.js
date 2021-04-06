// Business logic here
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

class CatService extends BaseService{
  async getCats(callback) {
    const [err, data] = await this.dataAccessor.getCats()

    if (err) {
      callback(true, {msg: 'Error in getCats service', err: err})
    } else {
      callback(false, transformers.transformCats(data))
    }
  }
}

module.exports = CatService
