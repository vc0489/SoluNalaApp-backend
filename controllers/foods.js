const foodsRouter = require('express').Router()
let foodService

foodsRouter.get('/brands', (req, res, next) => {
  foodService.getFoodBrands((err, data) => {
    if (err) {
      res.status(500).json(err)
    }
    res.json(data)
  })
})

foodsRouter.get('/products', (req, res, next) => {
  let brand = null
  let brandId = null
  if ('brand_id' in req.query) {
    brandId = req.query.brand_id
  } else if ('brand' in req.query) {
    brand = req.query.brand
  }
  console.log(brand)
  foodService.getFoodProducts(brand, brandId, (err, data) => {
    if (err) {
      res.status(500).json(data)
    }
    res.json(data)
  })
})

foodsRouter.get('/ratings', (req, res, next) => {
  // query params: cat_id, brand, product_id
  foodService.getFoodRatings((err, data) => {
    if (err) {
      res.status(500).json(data)
    }
    res.json(data)
  })
})

foodsRouter.post('/brands', (req, res, next) => {
  // body: {brand: [brandToInsert]}
  const brand = req.body.brand
  foodService.insertFoodBrand(brand, (err, resObj) => {
    if (err) {
      res.status(500).json(data)
    }
    res.json(resObj)
  })
})

foodsRouter.post('/products', (req, res, next) => {
  const { brand, product } = req.body
  foodService.insertFoodProduct(brand, product, (err, resObj) => {
    if (err) {
      res.status(500).json(resObj)
      return
    } 
    res.json(resObj)
  })
})

foodsRouter.post('/ratings', (req, res, next) => {
  const body = req.body
  console.log('in POST /api/v1/foods/ratings')
  console.log(body)

  foodService.insertFoodRating(body, (err, resObj) =>{
    console.log('foodService.insertFoodRating:', err, resObj)
    if (err) {
      res.status(500).json(resObj)
      return
    }
    
    res.json(resObj)
  })
})

module.exports = _foodService => {
  foodService = _foodService
  return foodsRouter
}
