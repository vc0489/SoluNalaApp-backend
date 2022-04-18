const checkUser = (req, res, next) => {
  console.log('---checkUser---')
  //const pubPaths = ['/', '/']
  //if (req.path == '/')
  if (!req.user_id) {
    return next({
      error_type: 'UnauthenticatedUser',
      msg: 'Unauthenticated user'
    })
  }
  next()
}

module.exports = checkUser