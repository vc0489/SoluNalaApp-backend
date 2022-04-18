const defaultQueryParam = (param, defaultValue) => {
  return (req, res, next) => {
    console.log('---defaultQueryParam---')
    console.log('param:  ', param)
    if (req.query[param] === undefined) {
      req.query[param] = defaultValue
      console.log(`replaced with default value '${defaultValue}'`)
    }
    console.log('-------------------')
    next()
  }
}
module.exports = defaultQueryParam