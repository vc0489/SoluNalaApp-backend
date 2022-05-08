// Business logic here
const errors = require('./utils/errors')
const transformers = require('./utils/data_transformers')
const BaseService = require('./base')
const dao = require('../data_handlers/dao_sql')

class NoteService extends BaseService{
  async getNoteTypes(userId, callback) {
    const data = await this._getUserNoteTypes(userId)
    callback(transformers.transformNoteTypes(data))
  }

  async addNoteType(userId, description, callback) {
    const userNoteTypes = await this._getUserNoteTypes(userId)
    //const curDescriptions = userNoteTypes.map(noteType => noteType.type_description)

    const duplicateType = userNoteTypes.filter(noteType => noteType.type_description === description)
    if (duplicateType.length) {
      throw new errors.DuplicateDataError(
        `Note type with description ${description} already exists`,
        null,
        {id: duplicateType[0].id}
      )
    }

    // Insert new note type
    const [err, typeId] = await dao.insertNoteType(
      userId,
      description
    )

    if (err) {
      throw new errors.DatabaseError(
        'Failed adding note type to the DB',
        err
      )
    }

    const noteTypeObj = {
      id: typeId,
      description
    }

    callback(noteTypeObj)
  }

  async updateNoteType(userId, noteTypeId, description, callback) {
    const userNoteTypes = await this._getUserNoteTypes(userId)
    const noteTypeToUpdate = userNoteTypes.filter(row => row.id == noteTypeId)
    if (noteTypeToUpdate.length === 0) {
      throw new errors.ResourceNotFoundError(
        'Note type does not exist or does not belong to user',
        null
      )
    }

    // If same description, return current object
    if (noteTypeToUpdate[0].type_description === description) {
      callback({
        id: noteTypeId,
        description
      })
      return
    }

    const curDescriptions = userNoteTypes.map(noteType => noteType.type_description)

    if (curDescriptions.includes(description)) {
      throw new errors.DuplicateDataError(
        `Note type with description ${description} already exists`,
        null
      )
    }

    const data = await this.daoRequest(
      'updateNoteType',
      [noteTypeId, description],
      'Failed to update note type in the DB'
    )

    callback({
      id: noteTypeId,
      description
    })
  }

  async deleteNoteType(userId, noteTypeId, cascadeDelete, callback) {
    await this.assertNoteTypeIdBelongsToUser(userId, noteTypeId)

    const notesOfType = await this.daoRequest(
      'getNotesOfType',
      [noteTypeId],
      'Failed to fetch notes from the DB'
    )
    let dataFn
    if (notesOfType.length) {
      if (!cascadeDelete) {
        throw new errors.BadRequest(
          `Notes with type ${noteTypeId} exist.`
        )
      }
      dataFn = 'cascadeDeleteNoteType'
    } else {
      dataFn = 'deleteNoteType'
    }
    const data = await this.daoRequest(
      dataFn,
      [noteTypeId],
      'Failed to delete note type from the DB'
    )
    callback(data)
  }


  async getNotes(userId, callback) {
    const [err, data] = await dao.getUserNotes(userId)

    if (err) {
      throw new errors.DatabaseError(
        'Error getting notes from the DB',
        err
      )
    }
    callback(transformers.transformNotes(data))
  }

  async getNoteById(userId, noteId, callback) {
    const note = await this.assertNoteIdBelongsToUser(userId, noteId)

    callback(transformers.transformNotes(note))
  }

  async insertNoteV2(userId, note, callback) {
    await this.assertCatIdsBelongToUser(userId, note.cat_id)

    if (!('end_datetime' in note)) note.end_datetime = null

    const noteInsertObj = transformers.transformNotesToSqlV2(note)

    const insertNoteId = await this.daoRequest(
      'insertNotesV2',
      [[noteInsertObj]],
      'Error inserting note into DB'
    )

    callback({
      ...note,
      id: insertNoteId
    })
  }
  async insertNote(userId, note, callback) {
    // Assume note is an object with the following fields:
    // -- cat_id
    // -- date
    // -- type_id
    // -- content
    // -- (Optional) time
    // returns - obj of inserted note
    await this.assertCatIdsBelongToUser(userId, note.cat_id)

    if (!('time' in note)) note.time = null

    const noteInsertObj = transformers.transformNotesToSql(note)

    const insertNoteId = await this.daoRequest(
      'insertNotes',
      [[noteInsertObj]],
      'Error inserting note into DB'
    )

    callback({
      ...note,
      id: insertNoteId
    })
  }

  async insertNotes(insertData, callback) {
    throw new errors.NotImplementedError('TODO', null)

    // Filter insertData?
    // Compulsory: cat_id, note_type_id?, date, content
    // insertData = insertData.filter(entry => {
    //   return (entry.cat_id && entry.note_type_id && entry.date && entry.content)
    // })

    // insertData = insertData.map(entry => {
    //   if (!entry.time) entry.time = 'N/A'
    //   return entry
    // })

    // console.log(insertData)

    // const [err, insertNoteId] = await this.dataAccessor.insertNotes(insertData)
    // if (err) {
    //   callback(true, {msg: 'Error in insertNotes service', err: err})
    //   return
    // }
    // callback(false, insertNoteId)
  }

  async updateNote(userId, noteId, updateObj, callback) {
    const note = await this.assertNoteIdBelongsToUser(userId, noteId)

    if ('type_id' in updateObj) {
      await this.assertNoteTypeIdBelongsToUser(userId, updateObj.type_id)
    }

    if ('cat_id' in updateObj) {
      await this.assertCatIdsBelongToUser(
        userId, updateObj.cat_id, `Cat with ID ${updateObj.cat_id} does not belong to user`
      )
    }

    const updateSqlFields = transformers.transformNotesToSql(updateObj)

    await this.daoRequest(
      'updateNote',
      [noteId, updateSqlFields],
      'Failed to update note in the DB'
    )

    callback(
      {
        ...transformers.transformNotes(note),
        ...updateObj
      }
    )
  }

  async deleteNote(userId, noteId, callback) {
    // TODO - finish
    await this.assertNoteIdBelongsToUser(userId, noteId)

    const data = await this.daoRequest(
      'deleteNote',
      noteId,
      'Failed to delete note from the DB'
    )

    callback(data)
  }

  async _getUserNoteTypes(userId) {
    const data = await this.daoRequest(
      'getUserNoteTypes',
      [userId],
      'Error getting note types from the DB',
    )
    return data
  }
}

module.exports = NoteService

