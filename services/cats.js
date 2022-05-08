// Business logic here
const errors = require('./utils/errors')
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

const wait = ms => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log("Done waiting");
      resolve(ms)
    }, ms )
  })
}
class CatService extends BaseService{
  async getCats(userId, callback) {
    const data = await this._getUserCats(userId)
    callback(transformers.transformCats(data))
  }

  async addCat(userId, catData, callback) {
    /* catData object:
    -- name: str
    -- breed: str
    -- colour: str
    -- birthdate: date(str)
    */

    //throw new Error('Test Error')
    //await wait(5000)
    //const {name, breed, colour, birthdate} = catData

    // First check if cat with same name already exists for user
    const userCats = await this._getUserCats(userId)
    const userCatNames = userCats.map(cat => cat.cat_name)

    if (userCatNames.includes(catData.name)) {
      throw new errors.DuplicateDataError(
        `Cat with name ${catData.name} already exists`,
        null
      )
    }

    catData['user_id'] = userId
    const updateObj = transformers.transformCatsToSql(catData)

    // Insert new cat
    const insertCatId = await this.daoRequest(
      'insertCat',
      [updateObj],
      'Failed adding cat to the DB'
    )

    const catObj = {
      id: insertCatId,
      ...catData
    }

    callback(catObj)
  }

  async updateCat(userId, catId, updateObj, callback) {
    await this.assertCatIdsBelongToUser(userId, catId, 'Cat does not belong to user')
    const updateObjSqlFields = transformers.transformCatsToSql(updateObj)

    const data = await this.daoRequest(
      'updateCat',
      [catId, updateObjSqlFields],
      'Failed to update cat in the DB',
    )

    callback({
      id: catId,
      ...updateObj
    })
  }

  async deleteCat(userId, catId, callback) {
    await this.assertCatIdsBelongToUser(userId, catId)
    await this.daoRequest(
      'deleteCat',
      [catId],
      'Failed to delete cat from the DB'
    )
    callback()
  }

  async _getUserCats(userId) {
    const data = await this.daoRequest(
      'getUserCats',
      [userId],
      'Failed getting cat data from the DB'
    )
    return data
  }
}

module.exports = CatService
