const notesRouter = require('express').Router()
const NoteService = require('../services/notes')
let noteService

notesRouter.get('/types', (req, res, next) => {
  noteService.getNoteTypes((err, data) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNoteTypes"})
    }
    res.json(data)
  })
})

notesRouter.get('/entries', (req, res, next) => {
  
  noteService.getNotes(req.query.cat_id, req.query.note_type_id, (err, data) => {
    if (err) {
      res.status(500).json({error: "Server Error when calling db.getNotes"})
    }
    res.json(data)
  })
})

notesRouter.post('/entries', (req, res, next) => {
  const body = req.body
  console.log(body)
  
  noteService.insertNotes(body, (err, dbRes) => {
    if (err) {
      res.status(500).json({
        error: 'Internal error when calling db.getWeights - ' + dbRes
      })
    }
    res.json(dbRes)
  })
})

module.exports = _noteService => {
  noteService = _noteService
  return notesRouter
}