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