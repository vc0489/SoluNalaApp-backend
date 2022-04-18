const catsRouter = require('express').Router()
const checkUser = require('./../middleware/checkUser')
const {
  createObjectOptionalFields,
  ensureReqFieldNotEmpty,
  fillOptionalFieldsDefaultNull,
  requireFieldsNotNull
} = require('../middleware/bodyFieldValidator')

let catService
//let authenticator

catsRouter.use(checkUser)

// from https://blog.praveen.science/right-way-of-delaying-execution-synchronously-in-javascript-without-using-loops-or-timeouts/
// and https://gist.github.com/mrienstra/8aa4eeeeab2012d2aa8ffc7f5e45f280
function delay(n) {  
  n = n || 2000
  return new Promise(done => setTimeout(done, n))
}

// Get user cats
catsRouter.get('/', async (req, res, next) => {
  //await delay(10000)
  catService.getCats(req.user_id, cats => {
    res.json(cats)
  }).catch(e => {
    next(e)
  })
})

// Add new cat
catsRouter.post(
  '/',
  requireFieldsNotNull(['name']),
  fillOptionalFieldsDefaultNull(['breed', 'colour', 'birthdate']),
  async (req, res, next) => {
    catService.addCat(req.user_id, req.body, newCatObj => {
      res.json(newCatObj)
    }).catch(e => {
      next(e)
    })
  }
)

catsRouter.patch(
  '/:catId/',
  createObjectOptionalFields(['name', 'breed', 'colour', 'birthdate'], 'updateObj'),
  ensureReqFieldNotEmpty('updateObj'),
  async (req, res, next) => {
    catService.updateCat(
      req.user_id,
      req.params.catId,
      req.updateObj,
      updatedCatObj => {
        res.json(updatedCatObj)
      }
    ).catch(e => {
      next(e)
    })
  }
)

catsRouter.delete(
  '/:catId/',
  async (req, res, next) => {
    catService.deleteCat(
      req.user_id,
      req.params.catId,
      () => {
        res.sendStatus(204)
      }
    ).catch(e => {
      next(e)
    })
  }
)

module.exports = _catService => {
  catService = _catService
  //authenticator = _authenticator
  return catsRouter
}