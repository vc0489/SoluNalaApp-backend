const catsRouter = require('express').Router()
const CatService = require('../services/cats')
let catService

catsRouter.get('/', async (req, res, next) => {
  console.log('In /api/v1/cats')

  catService.getCats((err, data) => {
    if (err) {
      res.status(500).json({msg: "Server error fetching cat data", err: err.err})
    } else {
      res.json(data)
    }
  })
})

module.exports = _catService => {
  catService = _catService
  return catsRouter
}

/*
module.exports = _appService => {
  appService = _appService
  return catsRouter
}
*/