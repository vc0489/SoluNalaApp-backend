const notesRouter = require('express').Router()
const transformers = require('./utils/data_transformers')
let db_obj

notesRouter.get('/types', (req, res, next) => {
  db_obj.getNoteTypes((err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNoteTypes"})
      return
    }
    const output_rows = rows.map(row => {
      return ({
        id: row.id,
        description: row.type_description,
      })
    })
    res.json(output_rows)
  })
})

notesRouter.get('/entries', (req, res, next) => {
  const cat_id = req.query.cat_id || null
  const note_type_id = req.query.note_type_id || null
  
  db_obj.getNotes(cat_id, note_type_id, (err, rows) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNotes"})
      return
    }
    res.json(transformers.transformNotes(rows))
  })
})

notesRouter.post('/entries', (req, res, next) => {
  const body = req.body
  console.log('in POST /api/v1/notes')
  console.log(body)
  
  if (!body[0].cat_id || !body[0].note_type_id || !body[0].date || !body[0].content ) {
    return res.status(400).json({
      error: 'cat_id, note_type_id, date or content missing'
    })
  }
  
  db_obj.insertNotes(
    body,
    (err, query_res) => {
      if (err) {
        res.status(500).json({error: "Server Error when calling db.postNote"})
        return
      }
      console.log('query_res:', query_res)
      console.log(`note id=${query_res.insertId}`)
      const addedNotes = body.map((note, index) => {
        return {...note, 'id': query_res.insertId+index}
      })
      res.json({result: 'Success', added_notes: addedNotes})
    }
  )
})

module.exports = (_db_obj) => {
  db_obj = _db_obj
  return notesRouter
}