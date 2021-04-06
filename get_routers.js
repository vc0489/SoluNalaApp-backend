const dataAccessor = require('./get_data_accessor').getPool() // data accessor object

const CatService = require('./services/cats')
const FoodService = require('./services/foods')
const NoteService = require('./services/notes')
const WeightService = require('./services/weights')

const catService = new CatService(dataAccessor)
const foodService = new FoodService(dataAccessor)
const noteService = new NoteService(dataAccessor)
const weightService = new WeightService(dataAccessor)

// Get routers
//const appService = require('./services/main')(dataAccessor)
const catsRouter = require('./controllers/cats')(catService)
const foodsRouter = require('./controllers/foods')(foodService)
const weightsRouter = require('./controllers/weights')(weightService)
const notesRouter = require('./controllers/notes')(noteService)

module.exports = {
  catsRouter,
  foodsRouter,
  weightsRouter,
  notesRouter
}