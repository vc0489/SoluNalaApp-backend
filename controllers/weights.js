const weightsRouter = require('express').Router()
const checkUser = require('./../middleware/checkUser')
const {
  createObjectOptionalFields,
  ensureReqFieldNotEmpty,
  requireFieldsNotNull,
  requireFieldsArrayNotNull,
} = require('../middleware/bodyFieldValidator')
const csvBufferToJson = require('./../middleware/csvBufferToJson')

let weightService
const CSV_WEIGHT_DATA_FIELD = 'weight_data'

// For CSV upload handling
const csv = require('csvtojson')
const multer = require('multer')
//const memoryStorage = multer.memoryStorage()
const memUpload = multer({
  storage: multer.memoryStorage(),
  limit: { fileSize: 30 * 1024 * 2014, files: 1}
})

weightsRouter.use(checkUser)

/* Weight data schema:
{
  [
    {
      cat_id: int
      grams: int,
      date: date,
    },
    {
      cat_id: int
      grams: int,
      date: date,
    },
    {
      ...
    }
  ]
}
*/

// Get all weights of cats belonging to user
// TODO - order by increasing date
weightsRouter.get('/', (req, res, next) => {
  weightService.getWeights(req.user_id, weights => {
    res.json(weights)
  }).catch(e => {
    next(e)
  })
})

weightsRouter.post(
  '/',
  requireFieldsNotNull(['cat_id', 'date', 'grams']),
  async (req, res, next) => {
    weightService.insertWeight(req.user_id, req.body, insWeight => {
      res.json(insWeight)
    }).catch(e => {
      next(e)
    })
  }
)

// TODO - requireFieldArrayNotNull, allow check on field of body rather than just body
weightsRouter.post(
  '/file/',
  memUpload.single('csvFile'), // Load CSV data into req.file (cat_id is field of form data))
  requireFieldsNotNull(['cat_id']),
  csvBufferToJson(CSV_WEIGHT_DATA_FIELD),
  requireFieldsArrayNotNull(['Date', 'Weight'], CSV_WEIGHT_DATA_FIELD), // Validate weight data
  async (req, res, next) => {
    weightService.insertWeightsFromFile(
      req.user_id,
      req.body.cat_id,
      req.body[CSV_WEIGHT_DATA_FIELD],
      insWeights => {
        res.json(insWeights)
      }
    ).catch(e => {
      next(e)
    })
  }
)

// Expect array of json objects
// Filtering (require cat_id, grams, date) currently done at service layer
weightsRouter.post(
  '/bulk/',
  requireFieldsArrayNotNull(['cat_id', 'date', 'grams']),
  async (req, res, next) => {
    weightService.insertWeights(req.user_id, req.body, insWeights => {
      res.json(insWeights)
    }).catch(e => {
      next(e)
    })
  }
)

weightsRouter.put(
  '/bulk/',
  requireFieldsArrayNotNull(['cat_id', 'date', 'grams']),
  async (req, res, next) => {
    weightService.upsertWeights(req.user_id, req.body, (deletedIds, insWeights) => {
      res.json({
        DeletedIds: deletedIds,
        InsertedWeights: insWeights
      })
    }).catch(e => {
      next(e)
    })
  }
)

weightsRouter.put(
  '/file/',
  memUpload.single('csvFile'), // Load CSV data into req.file (cat_id is field of form data))
  requireFieldsNotNull(['cat_id']),
  csvBufferToJson(CSV_WEIGHT_DATA_FIELD),
  requireFieldsArrayNotNull(['Date', 'Weight'], CSV_WEIGHT_DATA_FIELD), // Validate weight data
  async (req, res, next) => {
    weightService.insertWeightsFromFile(
      req.user_id,
      req.body.cat_id,
      req.body[CSV_WEIGHT_DATA_FIELD],
      (deletedIds, insWeights) => {
        res.json({
          DeletedIds: deletedIds,
          InsertedWeights: insWeights
        })
      }
    ).catch(e => { next(e) })
  }
)

weightsRouter.patch(
  '/:id/',
  createObjectOptionalFields(['cat_id', 'date', 'grams'], 'updateObj'),
  ensureReqFieldNotEmpty('updateObj'),
  async (req, res, next) => {
    weightService.updateWeight(req.user_id, req.params.id, req.updateObj, updatedWeight => {
      res.json(updatedWeight)
    }).catch(e => { next(e) })
  }
)

weightsRouter.delete(
  '/:id/',
  async (req, res, next) => {
    weightService.deleteWeight(req.user_id, req.params.id, () => {
      res.sendStatus(204)
    }).catch(e => {
      next(e)
    })
  }
)


module.exports = _weightService => {
  weightService = _weightService
  return weightsRouter
}