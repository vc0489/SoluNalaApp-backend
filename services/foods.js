// Business logic here
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

class FoodService extends BaseService {
  
  async getFoodBrands(callback) {
    const [err, data] = await this.dataAccessor.getFoodBrands()
    
    if (err) {
      callback(true, {msg: 'Error in getFoodBrands service', err: err})
    } else {
      callback(false, data)
    }
  }

  async getFoodProducts(brand, brandId, callback) {
    // Brand takes precedence over brand ID
    if (brand) {
      const [getBrandIdErr, resBrandId] =  await this._brandIdFromBrand(brand)
      if (getBrandIdErr) {
        callback(true, {msg: 'Error in getFoodProducts service', err: getBrandIdErr})
        return
      }
      brandId = resBrandId
    }

    console.log('brandID:', brandId)
    const [err, data] = await this.dataAccessor.getFoodProducts(brandId)

    if (err) {
      callback(true, {msg: 'Error in getFoodProducts service', err: err})
      return
    } else {
      callback(false, transformers.transformFoods(data))
    }
  }
  
  async getFoodRatings(callback) {
    const [err, data] = await this.dataAccessor.getFoodRatings()

    if (err) {
      callback(true, {msg: 'Error in getFoodRatings service', err: err})
    } else {
      callback(false, transformers.transformFoodRatings(data))
    }
  }
  
  async insertFoodBrand(brand, callback) {
    // [1] Trim starting and ending whitespace around brand
    // [2] Check if brand exists in DB
    // [3] If doesn't exist, perform insert
    // [4] Return brand ID of brand
    brand = brand.trim()

    const [insBrandErr, insBrandRes] = await this._insertFoodBrandIfExists(brand)

    if (insBrandErr) {
      callback(true, insBrandErr)
      return
    }
    callback(false, insBrandRes)
  }
  
  async _insertFoodBrandIfExists(brand) {
    // Assume brand is trimmed
    const [getBrandIdErr, brandId] = await this._brandIdFromBrand(brand)
    if (getBrandIdErr){
      return [true, getBrandIdErr]
    } else if (brandId) {
      return [false, {brand, brand_id: brandId}]
    }

    const [insBrandErr, insBrandId] = await this.dataAccessor.insertFoodBrand(brand)
    if (insBrandErr) {
      return [true, insBrandErr]
    }

    return [false, {brand, brand_id: insBrandId}]
  }

  async insertFoodProduct(brand, product, callback) {
    brand = brand.trim()
    product = product.trim()

    const [insBrandErr, insBrandRes] = await this._insertFoodBrandIfExists(brand)
    if (insBrandErr) {
      callback(true, insBrandRes)
    }

    const [insProdErr, insProdRes] = await this._insertFoodProductIfExists(insBrandRes.brand_id, product)
    if (insProdErr) {
      callback(true, insProdErr)
    }

    callback(false, {brand, ...insProdRes})
  }
  
  async _brandIdFromBrand(brand) {
    const [getBrandsErr, curBrands] = await this.dataAccessor.getFoodBrands()
    if (getBrandsErr) {
      return [true, getBrandsErr]
    }

    const brandInDb = curBrands.filter(item => item.brand === brand)
    if (brandInDb.length === 1) {
      return [false, brandInDb[0].id]
    } 
    return [false, null]
  }

  async _insertFoodProductIfExists(brandId, product) {
    // Assume product is trimmed
    const [getProdErr, curProd] = await this.dataAccessor.getFoodProducts(brandId)
    if (getProdErr) {
      return [true, getProdErr]
    }

    const prodInDb = curProd.filter(item => item.product === product)
    if (prodInDb.length === 1) {
      return [false, {brandId, product, product_id: prodInDb[0].product_id}]
    }

    const [insProdErr, insProdId] = await this.dataAccessor.insertFoodProduct(brandId, product)
    if (insProdErr) {
      return [true, insProdId]
    }

    return [false, {brand_id: brandId, product, product_id: insProdId}]
  }
  
  async insertFoodRating(insertData, callback) {
    /* insertData schema
    {
      cat_id: int - Cat ID
      brand: str - Brand name
      product: str - Product name
      date: date - Date of entry
      rating: int - Rating given
    }
    */
    let brand, product
    brand = insertData.brand.trim()
    product = insertData.product.trim()

    const { date, rating } = insertData
    const catId = insertData.cat_id

    const [insBrandErr, insBrandRes] = await this._insertFoodBrandIfExists(brand)
    if (insBrandErr) {
      //console.log('insBrandRes:', insBrandRes)
      callback(true, insBrandRes)
      return
    }
    const brandId = insBrandRes.brand_id

    const [insProdErr, insProdRes] = await this._insertFoodProductIfExists(brandId, product)
    if (insProdErr) {
      callback(true, insProdRes)
      return
    }
    const productId = insProdRes.product_id

    const [insRatingErr, insRatingRes] = await this._insertFoodRating(
      date, catId, productId, insertData.grams, rating
    )
    if (insRatingErr) {
      callback(true, insRatingRes)
      return
    }

    callback(false, {
      date: date,
      cat_id: catId,
      brand_id: brandId,
      brand,
      grams: insertData.grams,
      product_id: productId,
      product,
      rating: rating,
      id: insRatingRes
    })
  }

  async _insertFoodRating(date, catId, brandId, productId, rating) {
    const [insRatingErr, insRatingRes] = await this.dataAccessor.insertFoodRating(
      date, catId, brandId, productId, rating
    )
    if (insRatingErr) {
      return [true, insRatingErr]
    }
    return [false, insRatingRes.insertId]
  }
}

module.exports = FoodService