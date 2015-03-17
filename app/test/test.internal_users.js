var test = require('tape')
var rimraf = require('rimraf')
var request = require('supertest')
var restify = require('restify')

var datastore = require('datastore')

var logger = {
  debug: function() { },
  error: function() { }
}

var client = datastore({path: './tests-iuserdb'})

var users = require('internal/users')(client, logger)

var SERVER
var STR_CLIENT


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

  SERVER.get('/users', users.listUsers)
  SERVER.post('/users', users.createUser)
  SERVER.get('/users/:username', users.getUser)
  SERVER.del('/users/:username', users.deleteUser)
  SERVER.get('/users/:username/enable', users.enableUser)
  SERVER.get('/users/:username/disable', users.disableUser)
  SERVER.get('/users/:username/permissions', users.getUserPermissions)
  SERVER.put('/users/:username/permissions', users.addUserPermission)
  SERVER.del('/users/:username/permissions/:repo', users.removeUserPermission)

  SERVER.listen(9999, '127.0.0.1', function() {
    STR_CLIENT = restify.createStringClient({
        url: 'http://127.0.0.1:9999',
        retry: false
    })

    client.put(client.key('users', 'testing'), {
      username: 'testing',
      password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
      email: 'testing@testing.com',
      disabled: false,
      admin: true,
      permissions: {
        'testing': 'admin'
      }
    })
    client.put(client.key('users', 'testing2'), {
      username: 'testing2',
      password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
      email: 'testing2@testing.com',
      disabled: true,
      permissions: {
        'testing': 'admin'
      }
    })

    t.end()
  })
})


test('internal users - list users', function(test) {
  STR_CLIENT.get('/users', function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.body, JSON.stringify(['testing', 'testing2']))
    test.end()
  })
})


test('internal users - get valid user', function(test) {
  STR_CLIENT.get('/users/testing', function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.body, '{"username":"testing","email":"testing@testing.com","disabled":false,"admin":true,"permissions":{"testing":"admin"}}')
    test.end()
  })
})


test('internal users - get invalid user', function(test) {
  STR_CLIENT.get('/users/testing5', function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 404)
    test.equal(res.body, '{"message":"invalid user","error":false}')
    test.end()
  })
})


test('internal users - enable user', function(test) {
  STR_CLIENT.get('/users/testing/enable', function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 201)
    test.equal(res.body, '{"message":"account enabled","user":"testing"}')
    test.end()
  })
})


test('internal users - enable invalid user', function(test) {
  STR_CLIENT.get('/users/testing5/enable', function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 409)
    test.equal(res.body, '{"message":"user does not exist","error":true}')
    test.end()
  })
})


test('internal users - disable user', function(test) {
  STR_CLIENT.get('/users/testing/disable', function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 201)
    test.equal(res.body, '{"message":"account disabled","user":"testing"}')
    test.end()
  })
})


test('internal users - disable invalid user', function(test) {
  STR_CLIENT.get('/users/testing5/disable', function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 409)
    test.equal(res.body, '{"message":"user does not exist","error":true}')
    test.end()
  })
})


test('internal users - get user permissions', function(test) {
  STR_CLIENT.get('/users/testing/permissions', function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 200)
    test.equal(res.body, '{"testing":"admin"}')
    test.end()
  })
})


test('internal users - get invalid user permissions', function(test) {
  STR_CLIENT.get('/users/testing5/permissions', function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 404)
    test.equal(res.body, '{"message":"invalid user","error":false}')
    test.end()
  })
})


test('internal users - add user permissions', function(test) {
  var body = 'repo=awesome&access=admin'
  STR_CLIENT.put('/users/testing/permissions', body, function(err, req, res, data) {
    test.ifError(err)
    test.equal(res.statusCode, 202)
    test.ok(res)
    test.ok(req)
    test.equal(data, '{"success":true}')
    test.end()
  })
})


test('internal users - add invalid user permissions', function(test) {
  var body = 'repo=awesome&access=admin'
  STR_CLIENT.put('/users/testing5/permissions', body, function(err, req, res, data) {
    test.ok(err)
    test.equal(res.statusCode, 404)
    test.ok(res)
    test.ok(req)
    test.equal(data, '{"message":"invalid user"}')
    test.end()
  })
})


test('internal users - remove user permissions', function(test) {
  STR_CLIENT.del('/users/testing/permissions/awesome', function(err, req, res, data) {
    test.ifError(err)
    test.equal(res.statusCode, 200)
    test.ok(res)
    test.ok(req)
    test.equal(data, '{"success":true}')
    test.end()
  })
})


test('internal users - remove invalid user permissions', function(test) {
  STR_CLIENT.del('/users/testing5/permissions/awesome', function(err, req, res, data) {
    test.ok(err)
    test.equal(res.statusCode, 404)
    test.ok(res)
    test.ok(req)
    test.equal(data, '{"message":"invalid user"}')
    test.end()
  })
})


test('internal users - create user', function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing.com'
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ifError(err)
    test.equal(res.statusCode, 201)
    test.ok(res)
    test.ok(req)
    test.equal(data, '{"message":"account created","user":"testing3"}')
    test.end()
  })
})


test('internal users - create existing user', function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing.com'
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    var body = 'username=testing3&password=testing3&email=testing3@testing.com'
    STR_CLIENT.post('/users', body, function(err, req, res, data) {
      test.ok(err)
      test.equal(res.statusCode, 409)
      test.ok(res)
      test.ok(req)
      test.equal(data, '{"messsage":"user already exists","error":false}')
      test.end()
    })
  })  
})


test('internal users - create user missing username field', function(test) {
  var body = 'password=testing3&email=testing3@testing.com'
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err)
    test.equal(res.statusCode, 409)
    test.ok(res)
    test.ok(req)
    test.equal(data, 'username field is required')
    test.end()
  })
})


test('internal users - create user missing password field', function(test) {
  var body = 'username=testing3&email=testing3@testing.com'
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err)
    test.equal(res.statusCode, 409)
    test.ok(res)
    test.ok(req)
    test.equal(data, 'password field is required')
    test.end()
  })
})


test('internal users - create user missing email field', function(test) {
  var body = 'username=testing3&password=testing3'
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err)
    test.equal(res.statusCode, 409)
    test.ok(res)
    test.ok(req)
    test.equal(data, 'email field is required')
    test.end()
  })
})


test('internal users - delete user', function(t) {
  STR_CLIENT.del('/users/testing3', function(err, req, res, data) {
    t.ifError(err)
    t.equal(res.statusCode, 201)
    t.equal(data, '{"message":"account deleted","user":"testing3"}')
    t.end()
  })
})


test('internal users - tear down', function(t) {
  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-iuserdb', function() {
      t.end()
    })
  })
})
