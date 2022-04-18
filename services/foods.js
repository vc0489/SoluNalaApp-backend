// Business logic here
const errors = require('./utils/errors')
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

class FoodService extends BaseService {

  async getFoodBrands(userId, callback) {
    const data = await this.dataAccessorRequest(
      'getUserFoodBrands',
      [userId],
      'Error getting food brands from DB'
    )
    callback(transformers.transformFoodBrands(data))
  }

  async insertFoodBrand(userId, brand, callback) {
    // [1] Trim starting and ending whitespace around brand
    // [2] Check if brand exists in DB
    // [3] If doesn't exist, perform insert
    // [4] Return brand and brand ID as object
    brand = brand.trim()

    const brandObj = await this._upsertFoodBrand(userId, brand)

    //console.log('brandObj=', brandObj)
    callback(brandObj) // brandObj = { brand, id }
  }

  async updateFoodBrand(userId, brandId, brand, callback) {
    brand = brand.trim()

    await this._updateFoodBrand(userId, brandId, brand)

    callback({
      id: brandId,
      brand
    })
  }

  async deleteFoodBrand(userId, brandId, callback) {
    await this.assertBrandIdBelongsToUser(userId, brandId)

    const data = await this.dataAccessorRequest(
      'deleteFoodBrand',
      [brandId],
      'Failed to delete food brand from the DB'
    )

    callback(data)
  }

  // Product endpoints
  async getFoodProducts(userId, mappedOutput, callback) {
    const data = await this.dataAccessorRequest(
      'getUserFoodProducts',
      [userId],
      'Error getting food products from the DB',
    )
    if (mappedOutput) {
      callback(transformers.transformFoodProductsMapped(data))
    } else {
      callback(transformers.transformFoodProducts(data))
    }

  }

  async insertFoodProduct(userId, brandId, product, callback) {
    product = product.trim()

    await this.assertBrandIdBelongsToUser(userId, brandId)

    const productObj = await this._upsertFoodProduct(brandId, product)

    callback(productObj) // productObj = { brand_id, product, product_id }
  }

  async updateFoodProduct(userId, productId, updateObj, callback) {
    await this.assertProductIdBelongsToUser(userId, productId)

    if ('brand_id' in updateObj) {
      await this.assertBrandIdBelongsToUser(userId, updateObj.brand_id)
    }

    const data = await this.dataAccessorRequest(
      'updateFoodProduct',
      [productId, updateObj],
      'Failed to update food product in the DB'
    )

    // TODO - to complete
    callback(updateObj)
  }

  async deleteFoodProduct(userId, productId, callback) {
    await this.assertProductIdBelongsToUser(userId, productId)

    const data = await this.dataAccessorRequest(
      'deleteFoodProduct',
      [productId],
      'Failed to delete food product from the DB'
    )

    callback(data)
  }

  // Rating endpoints
  async getFoodRatings(userId, callback) {
    const data = await this.dataAccessorRequest(
      'getUserFoodRatings',
      [userId],
      'Error getting food ratings from the DB',
    )
    callback(transformers.transformFoodRatings(data))
  }

  async insertFoodRating(
    userId,
    insertData,
    callback,
  ) {
    /* insertData object schema
    {
      cat_id: int - Cat ID
      product_id: int - Product ID
      date: date - Date of entry
      rating: int - Rating given
    }
    */

    await this.assertProductIdBelongsToUser(
      userId,
      insertData.product_id,
      `Product ID ${insertData.product_id} does not belong to user`
    )

    const ratingInsertObj = transformers.transformFoodRatingsToSql(insertData)
    //console.log("🚀 ~ file: foods.js ~ line 105 ~ FoodService ~ ratingInsertObj", ratingInsertObj)

    const ratingId = await this.dataAccessorRequest(
      'insertFoodRating',
      [ratingInsertObj],
      'Error inserting food rating into DB'
    )

    callback({
      ...insertData,
      rating_id: ratingId
    })
  }

  async updateFoodRating(userId, ratingId, updateObj, callback) {
    await this.assertRatingIdBelongsToUser(userId, ratingId)

    if ('product_id' in updateObj) {
      await this.assertProductIdBelongsToUser(userId, updateObj.product_id)
    }

    if ('cat_id' in updateObj) {
      await this.assertCatIdsBelongToUser(
        userId, updateObj.cat_id, `Cat with ID ${updateObj.cat_id} does not belong to user`
      )
    }

    const ratingUpdateObj = transformers.transformFoodRatingsToSql(updateObj)
    const data = await this.dataAccessorRequest(
      'updateFoodRating',
      [ratingId, ratingUpdateObj],
      'Failed to update food rating in the DB'
    )

    // TODO - to complete
    callback(ratingUpdateObj)
  }

  async deleteFoodRating(userId, ratingId, callback) {
    await this.assertRatingIdBelongsToUser(userId, ratingId)

    const data = await this.dataAccessorRequest(
      'deleteFoodRating',
      ratingId,
      'Failed to delete food rating from the DB'
    )

    callback(data)
  }
  //-------------------//
  // Private functions //
  //-------------------//
  async _getUserFoodBrands(userId) {
    const data = await this.dataAccessorRequest(
      'getUserFoodBrands',
      [userId],
      'Error getting note types from the DB',
    )
    return data
  }

  async _upsertFoodBrand(userId, brand) {
    // * Assume brand is trimmed
    const brandId = await this._brandIdFromBrand(userId, brand)

    if (brandId) { // If brand exists already
      console.log(`Brand ${brand} already exists (id=${brandId})`)
      return {brand, id: brandId}
    }

    const insBrandId = await this.dataAccessorRequest(
      'insertFoodBrand',
      [userId, brand],
      'Error inserting brand into DB'
    )

    return {brand, id: insBrandId}
  }

  async _updateFoodBrand(userId, brandId, brand) {
    // * Assume brand is trimmed
    // Ensure brand belongs to user
    const userBrands = await this._getUserFoodBrands(userId)

    const brandToUpdate = userBrands.filter(row => row.id == brandId)
    if (brandToUpdate.length === 0) {
      throw new errors.ResourceNotFoundError(
        'Brand does not exist or does not belong to user',
        null
      )
    }

    // If same description, return current object
    if (brandToUpdate[0].brand_name === brand) {
      callback({
        id: brandId,
        brand
      })
      return
    }

    const curBrands = userBrands.map(brand => brand.brand_name)

    if (curBrands.includes(brand)) {
      throw new errors.DuplicateDataError(
        `Brand ${brand} already exists`,
        null
      )
    }

    // Brand with name doesn't exist
    const data = await this.dataAccessorRequest(
      'updateFoodBrand',
      [brandId, brand],
      'Error updating brand in DB'
    )
  }

  async _brandIdFromBrand(userId, brand) {
    const [err, userBrands] = await this.dataAccessor.getUserFoodBrands(userId)
    if (err) {
      throw new errors.DatabaseError(
        'Error getting user food brands from the DB',
        err
      )
    }

    const brandInDb = userBrands.filter(item => item.brand_name === brand)
    if (brandInDb.length === 1) {
      return brandInDb[0].id
    }
    return null
  }

  async _upsertFoodProduct(brandId, product) {
    const productId = await this._productIdIfExists(brandId, product)

    if (productId) {
      console.log(`Product ${product} of brand ID ${brandId} already exists (id=${productId})`)
      return {brand_id: brandId, product, product_id: productId}
    }

    const [err, insProductId] = await this.dataAccessor.insertFoodProduct(brandId, product)
    if (err) {
      throw new errors.DatabaseError(
        'Error inserting product into DB',
        err
      )
    }

    return {brand_id: brandId, product, product_id: insProductId}
  }

  async _productIdIfExists(brandId, product) {
    const [err, brandProducts] = await this.dataAccessor.getFoodBrandProducts(brandId)
    if (err) {
      throw new errors.DatabaseError(
        'Error getting food brand products from the DB',
        err
      )
    }

    const productInDb = brandProducts.filter(item => item.product === product)
    if (productInDb.length === 1) {
      return productInDb[0].product_id
    }
    return null
  }

}

module.exports = FoodService