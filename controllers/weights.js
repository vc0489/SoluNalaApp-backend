const weightsRouter = require('express').Router()
const transformers = require('./utils/data_transformers')

// For CSV upload handling
const csv = require('csvtojson')
const multer = require('multer')
const memoryStorage = multer.memoryStorage()
const memUpload = multer({
  storage: memoryStorage,
  limit: { fileSize: 30 * 1024 * 2014, files: 1}
})

let db_obj

// TODO - order by increasing date
// Latest entry per cat+date
weightsRouter.get('/entries', (req, res, next) => {
  const cat_id = req.query.cat_id || null
  console.log('cat_id=' + cat_id)
  
  db_obj.getWeights(cat_id, (err, rows, fields) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights'
      })
    }
    //console.log(rows)
    res.json(transformers.transformWeights(rows))
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
      grams: data.Weight,
      weigh_date: data.Date
    })
  })

  db_obj.insertWeights(cat_id, weightDataToInsert, (err, db_res) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + db_res
      })
    }

    res.json(transformers.transformWeights(db_res))
  })

})

weightsRouter.post('/entries', (req, res, next) => {
  const body = req.body
  
  console.log(body)
  if (!body.cat_id || !body.grams || !body.date) {
    return res.status(400).json({
      error: 'cat_id or grams or date missing'
    })
  }
  
  //TODO - use this to generate query
  const toInsert = [{
    grams: body.grams,
    weigh_date: body.date,
  }]

  db_obj.insertWeights(body.cat_id, toInsert, (err, db_res) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + db_res
      })
    }
    //console.log(`In POST /api/v1/weights: db_res=${JSON.stringify(transformers.transformWeights(db_res))}`)
    res.json(transformers.transformWeights(db_res))
  })
  
})


module.exports = (_db_obj) => {
  db_obj = _db_obj
  return weightsRouter
}