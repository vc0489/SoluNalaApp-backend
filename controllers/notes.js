const notesRouter = require('express').Router()
const checkUser = require('./../middleware/checkUser')
const {
  createObjectOptionalFields,
  ensureReqFieldNotEmpty,
  requireFieldsNotNull
} = require('../middleware/bodyFieldValidator')
const defaultQueryParam = require('./../middleware/defaultQueryParam')

const NoteService = require('../services/notes')
const noteService = new NoteService()

notesRouter.use(checkUser)

// Note types endpoints
notesRouter.get('/types/', (req, res, next) => {
  noteService.getNoteTypes(req.user_id, noteTypes => {
    res.json(noteTypes)
  }).catch(e => {
    next(e)
  })
})

notesRouter.post(
  '/types/',
  requireFieldsNotNull(['description']),
  (req, res, next) => {
    noteService.addNoteType(req.user_id, req.body.description, noteTypeObj => {
      res.json(noteTypeObj)
    }).catch(e => {
     next(e)
    })
  }
)

notesRouter.patch(
  '/types/:id/',
  requireFieldsNotNull(['description']),
  async (req, res, next) => {
    noteService.updateNoteType(req.user_id, req.params.id, req.body.description, noteTypeObj => {
      res.json(noteTypeObj)
    }).catch(e => {
      next(e)
    })
  }
)

notesRouter.delete(
  '/types/:id/',
  defaultQueryParam('cascade', ''),
  (req, res, next) => {
    let cascade = false
    if (req.query.cascade.toLowerCase() === 'true') {
      cascade = true
    }
    noteService.deleteNoteType(req.user_id, req.params.id, cascade, data => {
      if (cascade) {
        res.json({DeletedNoteIds: data})
      } else {
        res.sendStatus(204)
      }
    }).catch(e => {
      next(e)
    })
  }
)


// Note entries endpoints
notesRouter.get(
  '/entries/',
  (req, res, next) => {
    noteService.getNotes(req.user_id, notes => {
      res.json(notes)
    }).catch(e => {
      next(e)
    })
  }
)

// Post one note
// -- required fields: cat_id, date, type_id, content
// -- optional: time
notesRouter.post(
  '/entries/',
  requireFieldsNotNull(['cat_id', 'date', 'type_id', 'content']),
  async (req, res, next) => {
    noteService.insertNote(req.user_id, req.body, noteObj => {
      res.json(noteObj)
    }).catch(e => {
      next(e)
    })
  }
)

notesRouter.post(
  '/entriesV2/',
  requireFieldsNotNull(['cat_id', 'start_datetime', 'type_id', 'content']),
  async (req, res, next) => {
    noteService.insertNoteV2(req.user_id, req.body, noteObj => {
      res.json(noteObj)
    }).catch(e => {
      next(e)
    })
  }
)

// Get single note
notesRouter.get(
  '/entries/:id/',
  async (req, res, next) => {
    noteService.getNoteById(
      req.user_id,
      req.params.id,
      noteObj => {
        res.json(noteObj)
      }
    ).catch(e => {
      next(e)
    })
  }
)

notesRouter.patch(
  '/entries/:id/',
  createObjectOptionalFields(
    ['cat_id', 'date', 'type_id', 'content', 'time'],
    'updateObj'
  ),
  ensureReqFieldNotEmpty('updateObj'),
  async (req, res, next) => {
    noteService.updateNote(
      req.user_id,
      req.params.id,
      req.updateObj,
      updatedNoteObj => {
        res.json(updatedNoteObj)
      }
    ).catch(e => {
      next(e)
    })
  }
)

notesRouter.delete(
  '/entries/:id/',
  async (req, res, next) => {
    noteService.deleteNote(
      req.user_id,
      req.params.id,
      () => {
        res.sendStatus(204)
      }
    ).catch(e => {
      next(e)
    })
  }
)

module.exports = notesRouter