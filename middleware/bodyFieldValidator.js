const {
  validate_fields_exist,
  validate_array_of_fields_exist,
  validate_fields_not_null,
  validate_array_of_fields_not_null,
  //fill_optional_field,
  incomplete_fields_msg,
  incomplete_array_of_fields_msg,
  null_fields_msg,
  null_array_of_fields_msg
} = require('../controllers/utils/input_validation')

const { InvalidPostDataError } = require('../services/utils/errors')

const requireFieldsExist = requiredFields => {
  return (req, res, next) => {
    console.log('---requireFieldsExist---')
    console.log('requiredFields:  ', requiredFields)

    if (!validate_fields_exist(req.body, requiredFields)) {
      next(new InvalidPostDataError(incomplete_fields_msg(requiredFields)))
    }
    console.log('...passed')
    next()
  }
}

const requireFieldsArrayExist = requiredFields => {
  return (req, res, next) => {
    console.log('---requireFieldsArrayExist---')
    console.log('requiredFields:  ', requiredFields)

    if (!validate_array_of_fields_exist(req.body, requiredFields)) {
      next(new InvalidPostDataError(incomplete_array_of_fields_msg(requiredFields)))
    }
    console.log('...passed')
    next()
  }
}

const requireFieldsNotNull = requiredFields => {
  return (req, res, next) => {
    console.log('---requireFieldsNotNull---')
    console.log('requiredFields:  ', requiredFields)

    if (!validate_fields_not_null(req.body, requiredFields)) {
      next(new InvalidPostDataError(null_fields_msg(requiredFields)))
    }
    next()
  }
}

const requireFieldsArrayNotNull = (requiredFields, arrayField = null) => {
  return (req, res, next) => {
    console.log('---requireFieldsArrayNotNull---')
    console.log('requiredFields:  ', requiredFields)

    if (arrayField === null) {
      if (!validate_array_of_fields_not_null(req.body, requiredFields)) {
        next(new InvalidPostDataError(null_array_of_fields_msg(requiredFields)))
      }
    } else {
      if (!validate_array_of_fields_not_null(req.body[arrayField], requiredFields)) {
        next(new InvalidPostDataError(null_array_of_fields_msg(requiredFields)))
      }
    }

    next()
  }
}

const fillOptionalField = (field, defaultValue) => {
  return (req, res, next) => {
    console.log('---fillOptionalField---')
    console.log('field:  ', field)
    console.log('defaultValue:  ', defaultValue)

    if (!(field in req.body)) {
      req.body[field] = defaultValue
    }
    next()
  }
}

const fillOptionalFieldsDefaultNull = fields => {
  return (req, res, next) => {
    console.log('---fillOptionalFieldsDefaultNull---')
    console.log('fields:  ', fields)

    for (field of fields) {
      if (!(field in req.body)) {
        req.body[field] = null
      }
    }
    next()
  }
}

const createObjectOptionalFields = (fields, objName) => {
  return (req, res, next) => {
    console.log('---createObjectOptionalFields---')
    console.log('fields:  ', fields)
    console.log('objName:  ', objName)

    req[objName] = {}
    for (field of fields) {
      if (field in req.body) {
        req[objName][field] = req.body[field]
      }
    }
    next()
  }
}

const ensureReqFieldNotEmpty = field => {
  return (req, res, next) => {
    console.log('---ensureReqFieldNotEmpty---')
    console.log('field:  ', field)
    if (Object.keys(req[field]).length === 0) {
      next(new InvalidPostDataError('No valid cat fields provided, update not performed'))
    }
    console.log('...passed')
    next()
  }
}

module.exports = {
  createObjectOptionalFields,
  ensureReqFieldNotEmpty,
  requireFieldsExist,
  requireFieldsArrayExist,
  requireFieldsNotNull,
  requireFieldsArrayNotNull,
  fillOptionalField,
  fillOptionalFieldsDefaultNull
}