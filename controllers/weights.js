const weightsRouter = require('express').Router()
let weightService

// For CSV upload handling
const csv = require('csvtojson')
const multer = require('multer')
const memoryStorage = multer.memoryStorage()
const memUpload = multer({
  storage: memoryStorage,
  limit: { fileSize: 30 * 1024 * 2014, files: 1}
})

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
// TODO - order by increasing date
// Latest entry per cat+date
weightsRouter.get('/', (req, res, next) => {
  const cat_id = req.query.cat_id || null
  console.log('cat_id=' + cat_id)
  
  weightService.getWeights(cat_id, (err, data) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights'
      })
    }
    res.json(data)
  })
})

weightsRouter.post('/file', memUpload.single('csvFile'), async (req, res) => {
  console.log(req.file.buffer)
  const cat_id = req.body.catID
  //console.log(req.files)
  const weightData = await csv().fromString(req.file.buffer.toString())
  console.log('cat_id:', cat_id, '; weightData:', weightData)

  const weightDataToInsert = weightData.map(data => {
    return ({
      cat_id,
      grams: data.Weight || data.weight,
      date: data.Date || data.date
    })
  })

  weightService.insertWeights(weightDataToInsert, (err, dbRes) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + dbRes
      })
    }
    res.json(dbRes)
  })
})

weightsRouter.post('/', (req, res, next) => {
  const body = req.body
  console.log(body)
  
  //res.status(500).json({error: 'testing error handing in axios'})
  //return

  weightService.insertWeights(body, (err, dbRes) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + dbRes
      })
    }
    res.json(dbRes)
  })

  // TODO - return new weights if requested? Or maybe just send new GET request to API afterwards.
  //res.json(transformers.transformWeights(db_res))

})

module.exports = _weightService => {
  weightService = _weightService
  return weightsRouter
}