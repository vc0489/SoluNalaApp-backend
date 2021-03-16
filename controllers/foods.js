const foodsRouter = require('express').Router()
const transformers = require('./utils/data_transformers')
let db_obj

foodsRouter.get('/products', (req, res, next) => {
  db_obj.getFoods((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getFoods"})
      return
    }
    //console.log(`In ${baseUrl}foods: rows=${JSON.stringify(rows)}`)
    //const transformedFoods = transformers.transformFoods(rows)
    console.log('transformedFoods', transformers.transformFoods(rows))
    res.json(transformers.transformFoods(rows))
  })
})

foodsRouter.post('/ratings', (req, res, next) => {
  const body = req.body
  console.log('in POST /api/v1/foods')
  console.log(body)


  db_obj.insertFoodRating(body, (err, query_res) =>{
    console.log(query_res)
    // TODO - handle err etc.
  })
})

module.exports = (_db_obj) => {
  db_obj = _db_obj
  return foodsRouter
}