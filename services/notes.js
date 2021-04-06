// Business logic here
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')

class NoteService extends BaseService{
  async getNoteTypes(callback) {
    const [err, data] = await this.dataAccessor.getNoteTypes()
    
    if (err) {
      callback(true, {msg: 'Error in getNoteTypes service', err: err})
      return
    }
    callback(false, transformers.transformNoteTypes(data))
  }

  async getNotes(catId, noteTypeId, callback) {
    const [err, data] = await this.dataAccessor.getNotes(catId, noteTypeId)
    
    console.log('data', data)
    if (err) {
      callback(true, {msg: 'Error in getNoteTypes service', err: err})
      return
    }
    callback(false, transformers.transformNotes(data))
  }

  async insertNotes(insertData, callback) {
    // Filter insertData?
    // Compulsory: cat_id, note_type_id?, date, content
    insertData = insertData.filter(entry => {
      return (entry.cat_id && entry.note_type_id && entry.date && entry.content)
    })

    insertData = insertData.map(entry => {
      if (!entry.time) entry.time = 'N/A'
      return entry
    })

    console.log(insertData)

    const [err, insertNoteId] = await this.dataAccessor.insertNotes(insertData)
    if (err) {
      callback(true, {msg: 'Error in insertNotes service', err: err})
      return
    }
    callback(false, insertNoteId)
  }

}

module.exports = NoteService

