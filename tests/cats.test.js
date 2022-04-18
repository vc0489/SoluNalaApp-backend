const supertest = require('supertest')
const {app, dataAccessor} = require('../app')

const api = supertest(app)

beforeAll(done => {
  done()
})
test('health check', () => {
  api
    .get('/users/health')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('cats', () => {
  api
    .get('/cats/')
    .expect(401)
    // .expect('Content-Type', /application\/json/)
})

afterAll(done => {
  // dataAccessor.db.pool.end()
  done()
})