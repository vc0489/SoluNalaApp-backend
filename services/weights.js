// Business logic here
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

class WeightService extends BaseService{
  async getWeights(catId, callback) {
    const [err, data] = await this.dataAccessor.getWeights(catId)

    //console.log('data', data)
    if (err) {
      callback(true, {msg: 'Error in getWeights service', err: err})
      return
    }
    callback(false, transformers.transformWeights(data))
    
  }

  async insertWeights(insertData, callback) {
    // Filter - cat_id. grams and dat must all be values
    console.log('insertData', insertData)
    insertData = insertData.filter(row => (row.cat_id && row.grams && row.date))

    const [insertErr, insertWeightId] = await this._insertWeights(insertData)
    if (insertErr) {
      callback(true, {msg: 'Error in insertWeights service', err: insertErr})
      return
    }
    callback(false, insertWeightId)

  }

  async insertWeightsFromFile(catId, weightData, callback) {
    const weightDataToInsert = weightData.map(data => {
      return ({
        cat_id: catId,
        grams: data.Weight,
        weigh_date: data.Date
      })
    })
  }

  async _insertWeights(weights) {
    // Array of weights 
    const [insertErr, insertWeightId] = await this.dataAccessor.insertWeights(weights)
    return [insertErr, insertWeightId]
  }
}

module.exports = WeightService

