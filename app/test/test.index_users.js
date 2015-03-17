var test = require('tape')
var rimraf = require('rimraf')
var restify = require('restify')
var config = require('config')
var datastore = require('datastore')

var client = datastore({path: './tests-ixusersdb'})

var users = require('index/users')(config, client)

var SERVER
var STR_CLIENT

process.on('uncaughtException', function(err) {
  console.error(err.stack)
})

test('internal users - setup', function(t) {
  SERVER = restify.createServer({
    name: 'myapp',
    version: '1.0.0'
  })
  SERVER.use(restify.acceptParser(SERVER.acceptable))
  SERVER.use(restify.queryParser())
  SERVER.use(restify.bodyParser({
    mapParams: false,
    overrideParams: false
  }))

  SERVER.post('/v1/users', users.createUser)
  SERVER.get('/v1/users', users.validateUser)

  SERVER.listen(9999, '127.0.0.1', function() {
      STR_CLIENT = restify.createStringClient({
          url: 'http://127.0.0.1:9999',
          retry: false
      })

      t.end()
  })
})

test('internal users - create user', function(t) {
  var body = 'username=testing3&password=testing3&email=testing3@testing3.com'
  STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
    t.ifError(err, 'there shoudl be no error on create user')
    t.ok(req, 'there should be a req object on client')
    t.ok(res, 'there should be a res object on client')
    t.equal(res.body, data, 'body content should be equal')
    t.end()
  })
})

test('internal users - account disabled', function(test) {  
  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing3").toString('base64')
    }
  }
  
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.equal(res.statusCode, 403, 'status code should be 403')
    test.ok(res, 'there should be a res object')
    test.ok(req, 'there should be a req object')
    test.equal(data, '{"message":"account is not active"}', 'account should be inactive')
    test.end()
  })
})

test('internal users - user exists', function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing3.com'
  STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
    test.ok(err, 'the client should have no error')
    test.equal(res.statusCode, 400, 'the status code should be 400')
    test.equal(data, 'Username or email already exists', 'the user should already exist')
    test.end()
  })
})

test('internal users - successful login', function(test) {
  client.get(client.key('users', 'testing3'), function(err, value) {
    value.disabled = false
    client.put(client.key('users', 'testing3'), value)
  })

  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing3").toString('base64')
    }
  }
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err, 'the client should have no error')
    test.equal(res.statusCode, 200, 'the status code should be 200')
    test.end()
  })
})

test('internal users - bad username/password', function(test) {
  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing4").toString('base64')
    }
  }
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err, 'there should be an error')
    test.equal(res.statusCode, 401, 'the status code should be 401')
    test.equal(data, '{"message":"bad username and/or password (2)"}', 'the error message should be bad user/pass')
    test.end()
  })
})

test('internal users - nonexistent user', function(test) {
  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing2:testing2").toString('base64')
    }
  }
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err, 'there should be an error')
    test.equal(res.statusCode, 401, 'the status code should be 401')
    test.equal(data, '{"message":"bad username and/or password (2)"}', 'there should be an error message')
    test.end()
  })
})

test('internal users - tear down', function(t) {
  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-ixusersdb', function() {
      t.end()
    })
  })
})
