class BaseError  {
  constructor(message, error) {
    this.msg = message
    this.err = error
  }
}

class BadRequest extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 400
    this.error_type = 'BadRequest'
  }
}

class DatabaseError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 500
    this.error_type = 'DatabaseError'
  }
}

class DuplicateDataError extends BaseError {
  constructor(message, error, data=null) {
    super(message, error)
    this.error_code = 409
    this.error_type = 'DuplicateData'
    this.data = data
  }
}

class IncorrectPasswordError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 401
    this.error_type = 'IncorrectPassword'
  }
}

class InvalidPostDataError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 400
    this.error_type = 'InvalidPostData'
  }
}

class JsonWebTokenError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 401
    this.error_type = 'InvalidPostData'
  }
}

class NotImplementedError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 500
    this.error_type = 'NotImplemented'
  }
}

class RegistrationError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 500
    this.error_type = 'RegistrationError'
  }
}

class ResourceNotFoundError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 404
    this.error_type = 'ResourceNotFound'
  }
}

class ServerError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 500
    this.error_type = 'ServerError'
  }
}

class TestError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 418
    this.error_type = 'TestError'
  }
}

class UserAlreadyExistsError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 409
    this.error_type = 'UserAlreadyExists'
  }
}

class UserDoesNotExistError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 401
    this.error_type = 'UserDoesNotExist'
  }
}

class UnauthenticatedUserError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 401
    this.error_type = 'UnauthenticatedUser'
  }
}

class UnauthorisedError extends BaseError {
  constructor(message, error) {
    super(message, error)
    this.error_code = 401
    this.error_type = 'UnauthorisedError'
  }
}

module.exports = {
  BadRequest,
  DatabaseError,
  DuplicateDataError,
  IncorrectPasswordError,
  InvalidPostDataError,
  JsonWebTokenError,
  NotImplementedError,
  RegistrationError,
  ResourceNotFoundError,
  ServerError,
  TestError,
  UserAlreadyExistsError,
  UserDoesNotExistError,
  UnauthenticatedUserError,
  UnauthorisedError,
}


/*
const _errorCodeMap = {
  'DatabaseError': 500,
  'IncorrectPassword': 401,
  'InvalidPostData': 400,
  'JsonWebTokenError': 401,
  'RegistrationFail': 500,
  'Server': 500,
  'Test': 418, // For testing purposes
  'UserAlreadyExists': 409,
  'UserDoesNotExist': 401,
  'UnauthenticatedUser': 401,
  'Unauthorised': 401,
}

errorTypeToCode = error_type => {
  let code
  code = _errorCodeMap[error_type]
  if (!code) {
    code = 500 // Code for generic error
  }
  return code
}

module.exports = errorTypeToCode
*/