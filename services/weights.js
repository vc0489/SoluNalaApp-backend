// Business logic here
const errors = require('./utils/errors')
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')
const dao = require('../data_handlers/dao_sql')
class WeightService extends BaseService{
  // async getWeights(userId, callback) {
    async getWeights(userId) {
    const [err, data] = await dao.getUserWeights(userId)

    if (err) {
      throw new errors.DatabaseError(
        'Error getting weights from DB',
        err
      )
    }
    // callback(transformers.transformWeights(data))
    return transformers.transformWeights(data)
  }

  async insertWeight(userId, insertData, callback) {
    await this.assertCatIdsBelongToUser(
      userId,
      insertData.cat_id,
      'Cannot insert weight data for cat which do not belong to user'
    )

    const existingWeight = await this._getWeightForCatAndDate(insertData.cat_id, insertData.date)
    if (existingWeight.length) {
      throw new errors.DuplicateDataError(
        'Weight for cat and date already exists',
        null
      )
    }

    const insertedWeights = await this._insertWeights([insertData])
    callback(insertedWeights[0])
  }

  async insertWeights(userId, insertData, callback) {
    // * Validate all cat_id's belong to user
    // From https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
    const dataCatIds = insertData.map(data => data.cat_id)

    await this.assertCatIdsBelongToUser(
      userId,
      dataCatIds,
      'Cannot insert weight data for cat(s) which do not belong to user'
    )

    const insertedWeights = await this._insertWeights(insertData)
    callback(insertedWeights)
  }

  async insertWeightsFromFile(userId, catId, weightData, callback) {
    const userCatIds = await this.getUserCatIds(userId)

    await this.assertCatIdsBelongToUser(userId, userCatIds, 'Cannot update weight data for cats which do not belong to user')

    weightData = weightData.map(data => {
      return {
        cat_id: catId,
        grams: data.Weight,
        date: data.Date
      }
    })

    const insertedWeights = await this._insertWeights(weightData)
    callback(insertedWeights)
  }

  async upsertWeights(userId, insertData, callback) {
    const dataCatIds = insertData.map(data => data.cat_id)

    await this.assertCatIdsBelongToUser(userId, dataCatIds, 'Cannot update weight data for cats which do not belong to user')

    const [deletedIds, insertedWeights] = await this._upsertWeights(insertData)
    callback(deletedIds, insertedWeights)
  }

  async upsertWeightsFromFile(userId, catId, weightData, callback) {

    await this.assertCatIdsBelongToUser(userId, catId, 'Cannot update weight data for cats which do not belong to user')

    weightData = weightData.map(data => {
      return {
        cat_id: catId,
        grams: data.Weight,
        date: data.Date
      }
    })

    const insertedWeights = await this._upsertWeights(weightData)
    callback(deletedIds, insertedWeights)
  }

  async updateWeight(userId, weightId, weightObj, callback) {
    await this.assertWeightIdBelongsToUser(userId, weightId)

    console.log("pre-transform:", weightObj)
    const weightInsertObj = transformers.transformWeightsToSql(weightObj)
    console.log("post-transform:", weightInsertObj)
    await this.daoRequest(
      'updateWeight',
      [weightId, weightInsertObj],
      'Failed to update weight in the DB'
    )

    // TODO - expand?
    callback({
      ...weightObj,
      id: weightId,
    })
  }

  async deleteWeight(userId, weightId, callback) {
    await this.assertWeightIdBelongsToUser(userId, weightId)

    await this.daoRequest(
      'deleteWeight',
      [weightId],
      'Failed to delete weight from the DB'
    )
    callback()
  }


  //----------------------//
  //--- Helper methods ---//
  //----------------------//
  async _getWeightForCatAndDate(catId, date) {
    const [getErr, existingWeight] = await dao.getWeightsOfCatDatePairs([[catId, date]])

    if (getErr) {
      throw new errors.DatabaseError(
        'Error getting weights from the DB',
        getErr
      )
    }

    return existingWeight
  }

  async _upsertWeights(weights) {
    const [upsertErr, deletedIds, insertWeightIds] = await dao.upsertWeights(weights)

    if (upsertErr) {
      throw new errors.DatabaseError(
        'Error inserting weights into the DB',
        null
      )
    }

    weights = weights.map((data, dataI) => {
      return {
        weight_id: insertWeightIds[dataI],
        date: data.date,
        cat_id: data.cat_id,
        grams: data.grams
      }
    })
    return [deletedIds, weights]
  }

  async _insertWeights(weights) {
    // Array of weights, return object array of inserted weights
    const [insertErr, insertWeightIds] = await dao.insertWeights(weights)
    if (insertErr) {
      throw new errors.DatabaseError(
        'Error inserting weights into the DB',
        null
      )
    }

    weights = weights.map((data, dataI) => {
      return {
        id: insertWeightIds[dataI].toString(),
        date: data.date,
        cat_id: data.cat_id,
        grams: data.grams
      }
    })
    return weights
  }
}

module.exports = WeightService

