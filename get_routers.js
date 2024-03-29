

//const Authenticator = require('./authentication/Authenticator')
//const authenticator = new Authenticator(dataAccessor)

const UserService = require('./services/users')
const CatService = require('./services/cats')
const FoodService = require('./services/foods')
const NoteService = require('./services/notes')
const WeightService = require('./services/weights')
// const SlackService = require('./services/')


module.exports = schema => {

  // const dataAccessor = require('./get_data_accessor').getPool(schema) // data accessor object

  // const userService = new UserService(dataAccessor)
  // const catService = new CatService(dataAccessor)
  // const foodService = new FoodService(dataAccessor)
  // const noteService = new NoteService(dataAccessor)
  // const weightService = new WeightService(dataAccessor)

  // Get routers
  //const appService = require('./services/main')(dataAccessor)
  // const usersRouter = require('./controllers/users')(userService)
  // const catsRouter = require('./controllers/cats')(catService)
  // const foodsRouter = require('./controllers/foods')(foodService)
  // const weightsRouter = require('./controllers/weights')(weightService)
  // const notesRouter = require('./controllers/notes')(noteService)
  // const slackRouter = require('./controllers/slack')(userService, catService, weightService)

  const usersRouter = require('./controllers/users')
  const catsRouter = require('./controllers/cats')
  const foodsRouter = require('./controllers/foods')
  const weightsRouter = require('./controllers/weights')
  const notesRouter = require('./controllers/notes')
  const slackRouter = require('./controllers/slack')

  return {
    // dataAccessor,
    usersRouter,
    catsRouter,
    foodsRouter,
    weightsRouter,
    notesRouter,
    slackRouter,
  }
}