const app = require('./app')

console.log(`PORT=${process.env.PORT}`)
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})