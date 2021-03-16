const catsRouter = require('express').Router()
const transformers = require('./utils/data_transformers')
let db_obj

catsRouter.get('/', (req, res, next) => {
  console.log('In /api/v1/cats')
  
  db_obj.getCats((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getCats"})
      return
    }
    //console.log(`In /api/v1/cats: rows=${JSON.stringify(rows)}`)
    res.json(transformers.transformCats(rows))
  })
})

module.exports = (_db_obj) => {
  db_obj = _db_obj
  return catsRouter
}