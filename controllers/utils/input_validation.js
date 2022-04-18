validate_fields_exist = (obj, fields) => {
  for (field of fields) {
    if (!(field in obj)) {
      return false
    }
  }
  return true
}

validate_fields_not_null = (obj, fields) => {
  //console.log('obj=', obj)
  //console.log('fields=', fields)
  for (field of fields) {
    if (!(field in obj) || (obj[field] === null)) {
      return false
    }
  }
  return true
}

validate_array_of_fields_exist = (array, fields) => {
  for (item of array) {
    if (!validate_fields_exist(item, fields)) {
      return false
    }
  }
  return true
}

validate_array_of_fields_not_null = (array, fields) => {
  for (item of array) {
    if (!validate_fields_not_null(item, fields)) {
      return false
    }
  }
  return true
}

incomplete_fields_msg = fields => {
  return 'One of more fields are missing. Required fields: ' + String(fields)
}

incomplete_array_of_fields_msg = fields => {
  return 'One or more items have missing fields. Required fields in each item: ' + String(fields)
}

null_fields_msg = fields => {
  return 'One of more fields are are null. Required non-null fields: ' + String(fields)
}

null_array_of_fields_msg = fields => {
  return 'One or more items have null fields. Required non-null fields in each item: ' + String(fields)
}

fill_optional_field = (body, field, defaultValue) => {
  if (!(field in body)) {
    body.field = defaultValue
  }
  return body
}

module.exports = {
  validate_fields_exist,
  validate_fields_not_null,
  validate_array_of_fields_exist,
  validate_array_of_fields_not_null,
  fill_optional_field,
  incomplete_fields_msg,
  incomplete_array_of_fields_msg,
  null_fields_msg,
  null_array_of_fields_msg
}