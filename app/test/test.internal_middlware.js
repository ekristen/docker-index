var test = require('tape')
var rimraf = require('rimraf')
var request = require('supertest')
var restify = require('restify')
var crypto = require('crypto')
var path = require("path")
var fs = require('fs')

var datastore = require('datastore')

var logger = {
  debug: function() { },
  error: function() { }
}

var client = datastore({path: './tests-imiddledb'})

var middleware = require('internal/middleware')({}, client, logger)

var SERVER
var STR_CLIENT

test('internal middleware - setup', function(t) {
  
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

  function passed (req, res, next) {
    res.send(200, {message: 'success'})
  }

  SERVER.get('/require/auth', middleware.requireAuth, passed)
  SERVER.get('/require/admin', middleware.requireAuth, middleware.requireAdmin, passed)
  SERVER.get('/require/repo/:namespace', middleware.requireAuth, middleware.requireRepoAccess, passed)
  SERVER.get('/require/repo/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, passed)

  SERVER.listen(9999, '127.0.0.1', function() {
      STR_CLIENT = restify.createStringClient({
          url: 'http://127.0.0.1:9999',
          retry: false
      })

      var ws = client.createWriteStream()
      ws.on('close', function(err) {
        t.end()
      })
      ws.write({ key: client.key('users', 'testing'), value: {
        username: 'testing',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing@testing.com',
        disabled: false,
        admin: true,
        permissions: { 'testing': 'admin' }
      }})
      ws.write({ key: client.key('users', 'testing2'), value: {
        username: 'testing2',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing2@testing2.com',
        admin: false,
        disabled: true,
        permissions: {}
      }})
      ws.write({ key: client.key('users', 'testing3'), value: {
        username: 'testing3',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing3@testing3.com',
        admin: false,
        disabled: false,
        permissions: {
          'testing': 'admin'
        }
      }})
      ws.write({ key: client.key('users', 'testing4'), value: {
        username: 'testing4',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing3@testing3.com',
        admin: false,
        disabled: false,
        permissions: {
          'testing': 'read'
        }
      }})
      ws.end()
  })
})


test('internal middleware - invalid user', function(test) {

  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing5:testing5").toString('base64')
    }
  }
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 403)
    test.equal(res.body, '{"message":"access denied"}')
    test.end()
  })
})


test('internal middleware - invalid credentials', function(test) {

  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing3").toString('base64')
    }
  }
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 403)
    test.equal(res.body, '{"message":"access denied"}')
    test.end()
  })
})


test('internal middleware - missing auth header', function(test) {

  var options = {
    path: '/require/auth',
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 401)
    test.equal(res.body, '{"message":"authorization required"}')
    test.end()
  })
})


test('internal middleware - disabled account', function(test) {

  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing2:testing").toString('base64')
    }
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 403)
    test.equal(res.body, '{"message":"access denied"}')
    test.end()
  })
})


test('internal middleware - valid user', function(test) {

  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 200)
    test.equal(res.body, '{"message":"success"}')
    test.end()
  })
})


test('internal middleware - valid admin user', function(test) {

  var options = {
    path: '/require/admin',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 200)
    test.equal(res.body, '{"message":"success"}')
    test.end()
  })
})


test('internal middleware - invalid admin user', function(test) {

  var options = {
    path: '/require/admin',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing").toString('base64')
    }
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 403)
    test.equal(res.body, '{"message":"access denied"}')
    test.end()
  })
})


test('internal middleware - valid repo user', function(test) {

  var options = {
    path: '/require/repo/testing',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing").toString('base64')
    }
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 200)
    test.equal(res.body, '{"message":"success"}')
    test.end()
  })
})


test('internal middleware - invalid repo user', function(test) {

  var options = {
    path: '/require/repo/testing',
    headers: {
      authorization: 'Basic ' + new Buffer("testing4:testing").toString('base64')
    }
  }
  
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 403)
    test.equal(res.body, '{"message":"access denied"}')
    test.end()
  })
})


test('internal middleware - tear down', function(t) {

  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-imiddledb', function() {
      t.end()
    })
  })
})
