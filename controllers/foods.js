const checkUser = require('./../middleware/checkUser')
const {
  createObjectOptionalFields,
  ensureReqFieldNotEmpty,
  requireFieldsNotNull
} = require('../middleware/bodyFieldValidator')

const foodsRouter = require('express').Router()
let foodService

foodsRouter.use(checkUser)

//-----------------------
//--- Brand endpoints ---
//-----------------------
foodsRouter.get(
  '/brands/',
  (req, res, next) => {
    foodService.getFoodBrands(req.user_id, brands => {
      res.json(brands)
    }).catch(e => { next(e) })
  }
)

foodsRouter.post(
  '/brands/',
  requireFieldsNotNull(['brand']),
  (req, res, next) => {
    foodService.insertFoodBrand(req.user_id, req.body.brand, brandObj => {
      res.json(brandObj)
    }).catch(e => { next(e) })
  }
)

foodsRouter.patch(
  '/brands/:id/',
  requireFieldsNotNull(['brand']),
  (req, res, next) => {
    foodService.updateFoodBrand(req.user_id, req.params.id, req.body.brand, brandObj => {
      res.json(brandObj)
    }).catch(e => { next(e) })
  }
)

foodsRouter.delete(
  '/brands/:id/',
  (req, res, next) => {
    foodService.deleteFoodBrand(
      req.user_id,
      req.params.id,
      () => { res.sendStatus(204) }
    ).catch(e => { next(e) })
  }
)

//-------------------------
//--- Product endpoints ---
//-------------------------
foodsRouter.get(
  '/products/',
  (req, res, next) => {
    const mappedOutput = req.query.mappedOutput.toLowerCase() === 'true' ? true : false
    foodService.getFoodProducts(req.user_id, mappedOutput, products => {
      res.json(products)
    }).catch(e => { next(e) })
  }
)

foodsRouter.post(
  '/products/',
  requireFieldsNotNull(['brand_id', 'product']),
  (req, res, next) => {
    foodService.insertFoodProduct(
      req.user_id,
      req.body.brand_id,
      req.body.product,
      productObj => {
        res.json(productObj)
      }
    ).catch(e => {
      next(e)
    })
  }
)

foodsRouter.patch(
  '/products/:id/',
  createObjectOptionalFields(
    ['brand_id', 'product'],
    'updateObj'
  ),
  ensureReqFieldNotEmpty('updateObj'),
  (req, res, next) => {
    foodService.updateFoodProduct(
      req.user_id,
      req.params.id,
      req.updateObj,
      updatedProduct => {
        res.json(updatedProduct)
      }
    ).catch(e =>  { next(e) })
  }
)
foodsRouter.delete(
  '/products/:id/',
  (req, res, next) => {
    foodService.deleteFoodProduct(
      req.user_id,
      req.params.id,
      () => { res.sendStatus(204) }
    ).catch(e => { next(e) })
  }
)

//------------------------
//--- Rating endpoints ---
//------------------------
foodsRouter.get(
  '/ratings/',
  (req, res, next) => {
    foodService.getFoodRatings(req.user_id, ratings => {
      res.json(ratings)
    }).catch(e => { next(e) })
  }
)

foodsRouter.patch(
  '/ratings/:id/',
  createObjectOptionalFields(
    ['date', 'cat_id', 'product_id', 'rating'],
    'updateObj'
  ),
  ensureReqFieldNotEmpty('updateObj'),
  (req, res, next) => {
    foodService.updateFoodRating(
      req.user_id,
      req.params.id,
      req.updateObj,
      updatedRating => {
        res.json(updatedRating)
      }
    ).catch(e =>  { next(e) })
  }
)

foodsRouter.delete(
  '/ratings/:id/',
  (req, res, next) => {
    foodService.deleteFoodRating(
      req.user_id,
      req.params.id,
      () => { res.sendStatus(204) }
    ).catch(e => { next(e) })
  }
)

/*
cat_id: int - Cat ID
product_id: str - Product ID
date: date - Date of entry
rating: int - Rating given
*/
// TODO - date optional (get today date)
// TODO - rating optional? (null rating)
// TODO - add amount of food (grams)?
foodsRouter.post(
  '/ratings/',
  checkUser,
  requireFieldsNotNull(['date', 'cat_id', 'product_id']),
  (req, res, next) => {
    foodService.insertFoodRating(
      req.user_id,
      req.body,
      ratingObj => {
      res.json(ratingObj)
    }).catch(e => {
      next(e)
    })
  }
)

module.exports = _foodService => {
  foodService = _foodService
  return foodsRouter
}
