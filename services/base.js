const { DatabaseError, ResourceNotFoundError, UnauthorisedError } = require('./utils/errors')
const dao = require('../data_handlers/dao_sql')
class BaseService {
  async daoRequest(reqMethod, args, failMsg) {
    const [err, data] = await dao[reqMethod](...args)
    if (err) {
      throw new DatabaseError(failMsg, err)
    }
    return data
  }

  async getUserCatIds(userId) {
    const [err, data] = await dao.getUserCats(userId)
    if (err) {
      throw new DatabaseError(err, 'Error getting user cats from the DB')
    }

    const catIds = data.map(cat => cat.id)
    console.log('Cat IDs for user:', catIds)

    return catIds
  }

  async getUserCatsByEmail(email) {

  }

  async getUserBrandIds(userId) {
    //throw new DatabaseError('testErr', 'Error getting user products from the DB')

    const [err, data] = await dao.getUserFoodBrands(userId)
    if (err) {
      throw new DatabaseError('Error getting user food brands from the DB', err)
    }

    const brandIds = data.map(brand => brand.id)
    console.log('Brand IDs for user:', brandIds)

    return brandIds
  }

  async getUserProductIds(userId) {
    console.log('In getUserProductIds')

    const [err, data] = await dao.getUserFoodProducts(userId)
    console.log('getUserProductIds.err=', err)
    console.log('getUserProductIds.data=', data)
    if (err) {
      throw new DatabaseError('Error getting user food products from the DB', err)
    }

    const productIds = data.map(product => product.product_id)

    console.log('Product IDs for user:', productIds)

    return productIds
  }

  async catIdsBelongToUser(userId, catIds) {
    let uniqueCheckCatIds = [...new Set(catIds)]
    uniqueCheckCatIds = uniqueCheckCatIds.map(id => id.toString())

    let userCatIds = await this.getUserCatIds(userId)
    userCatIds = userCatIds.map(id => id.toString())

    const catIdsNotOfUser = uniqueCheckCatIds.filter(id => !userCatIds.includes(id))

    if (catIdsNotOfUser.length > 0) {
      return false
    }
    return true
  }

  async assertCatIdsBelongToUser(userId, catIds, errorMsg = null ) {
    if (typeof catIds === 'number') {
      catIds = catIds.toString()
    }

    if (typeof catIds === 'string') {
      catIds = [catIds]
    }

    if (typeof catIds[0] === 'number') {
      catIds = catIds.map(id => id.toString())
    }

    if (errorMsg == null) {
      errorMsg = 'Cat(s) do not belong to user'
    }

    const belongs = await this.catIdsBelongToUser(userId, catIds)
    if (!belongs) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

  async assertNoteTypeIdBelongsToUser(userId, noteTypeId, errorMsg = null) {
    const noteType = await this.daoRequest(
      'getSingleNoteType',
      [noteTypeId],
      'Failed to get note type from the DB'
    )

    if (noteType.length === 0) {
      throw new ResourceNotFoundError(
        'Note type does not exist',
        null
      )
    }

    if (errorMsg == null) {
      errorMsg = `Note type does not belong to the user`
    }

    if (noteType[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

  async assertNoteIdBelongsToUser(userId, noteId, errorMsg = null) {
    const note = await this.daoRequest(
      'getSingleNote',
      [noteId],
      'Failed to get note from the DB'
    )

    if (note.length === 0) {
      throw new ResourceNotFoundError(
        'Note does not exist',
        null
      )
    }

    if (errorMsg == null) {
      errorMsg = 'Note does not belong to the user'
    }

    if (note[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }

    return note[0]
  }

  async assertBrandIdBelongsToUser(userId, brandId, errorMsg = null) {
    const brand = await this.daoRequest(
      'getSingleFoodBrand',
      [brandId],
      'Failed to get food brand from the DB'
    )

    if (brand.length === 0) {
      throw new ResourceNotFoundError(
        'Food brand does not exist',
        null
      )
    }

    if (errorMsg === null) {
      errorMsg = 'Food brand does not belong to the user'
    }

    if (brand[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

  async assertProductIdBelongsToUser(userId, productId, errorMsg = null) {
    const product = await this.daoRequest(
      'getSingleFoodProduct',
      [productId],
      'Failed to get food product from the DB'
    )

    if (product.length === 0) {
      throw new ResourceNotFoundError(
        'Food product does not exist',
        null
      )
    }

    if (errorMsg === null) {
      errorMsg = 'Food product does not belong to the user'
    }

    if (product[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

  async assertWeightIdBelongsToUser(userId, weightId, errorMsg = null) {
    const weight = await this.daoRequest(
      'getSingleWeight',
      [weightId],
      'Failed to get weight from the DB'
    )

    if (weight.length === 0) {
      throw new ResourceNotFoundError(
        'Weight does not exist',
        null
      )
    }

    if (errorMsg == null) {
      errorMsg = `Weight does not belong to the user`
    }

    if (weight[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

  async assertRatingIdBelongsToUser(userId, ratingId, errorMsg = null) {
    // TODO - complete
    const rating = await this.daoRequest(
      'getSingleFoodRating',
      [ratingId],
      'Failed to get rating from the DB'
    )

    if (rating.length === 0) {
      throw new ResourceNotFoundError(
        'Rating does not exist',
        null
      )
    }

    if (errorMsg == null) {
      errorMsg = `Rating does not belong to the user`
    }

    if (rating[0].user_id != userId) {
      throw new UnauthorisedError(
        errorMsg,
        null
      )
    }
  }

}

module.exports = BaseService