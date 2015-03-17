var test = require('tape')
var rimraf = require('rimraf')
var request = require('supertest')
var restify = require('restify')
var crypto = require('crypto')

var datastore = require('datastore')

var logger = {
  debug: function() { },
  error: function() { }
}

var client = datastore({path: './tests-iwebhooksdb'})

var webhooks = require('internal/webhooks')({}, client, logger)
var middleware = require('internal/middleware')({}, client, logger)

var SERVER
var STR_CLIENT

test('internal webhooks - setup', function(t) {
  
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

  SERVER.get('/webhooks/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.listWebhooks)
  SERVER.get('/webhooks/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.listWebhooks)
  SERVER.post('/webhooks/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.addWebhook)
  SERVER.post('/webhooks/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.addWebhook)
  SERVER.del('/webhooks/:repo/:id', middleware.requireAuth, middleware.requireRepoAccess, webhooks.removeWebhook)
  SERVER.del('/webhooks/:namespace/:repo/:id', middleware.requireAuth, middleware.requireRepoAccess, webhooks.removeWebhook)

  SERVER.listen(9999, '127.0.0.1', function() {
    STR_CLIENT = restify.createStringClient({
        url: 'http://127.0.0.1:9999',
        retry: false
    })

    client.set(client.key('users', 'testing'), {
      username: 'testing',
      password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
      email: 'testing@testing.com',
      disabled: false,
      admin: true,
      permissions: {
        'testing': 'admin',
        'base': 'admin'
      }
    })

    t.end()
  })
})


test('internal webhooks - add webhook default event', function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }
  var body = {
    url: 'http://www.example.com/hook'
  }
  STR_CLIENT.post(options, body, function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 201)
    test.equal(res.body, '{"message":"webhook created","id":"d55ecc09f4cd1779d592b7c7f4bf3006fcb62a4c","events":["new"]}')
    test.end()
  })
})


test('internal webhooks - list webhooks', function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }
  var body = {
    url: 'http://www.example.com/hook'
  }
  STR_CLIENT.post(options, body, function(err, req, res, data) {
    
    var options = {
      path: '/webhooks/base/debian',
      headers: {
        authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
      }
    }
    STR_CLIENT.get(options, function(err, req, res, data) {
      test.ifError(err)
      test.ok(req)
      test.ok(res)
      test.equal(res.statusCode, 200)
      test.equal(res.body, '[{"id":"d55ecc09f4cd1779d592b7c7f4bf3006fcb62a4c","url":"http://www.example.com/hook","new":"true","existing":"false","active":true}]')                            
      test.end()
    })

  })  
})


test('internal webhooks - add webhook new existing events', function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }
  var body = {
    url: 'http://www.example.com/hook2',
    events: ['new','existing']
  }
  STR_CLIENT.post(options, body, function(err, req, res, data) {
    test.ifError(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 201)
    test.equal(res.body, '{"message":"webhook created","id":"bea56e556e7791c4a2cfec2d67b7fc8da9529851","events":["new","existing"]}')
    test.end()
  })
})


test('internal webhooks - add webhook for invalid event', function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }
  var body = {
    url: 'http://www.example.com/hook',
    events: ['new','existing', 'other']
  }
  STR_CLIENT.post(options, body, function(err, req, res, data) {
    test.ok(err)
    test.ok(req)
    test.ok(res)
    test.equal(res.statusCode, 409)
    test.equal(res.body, 'other event is not supported')
    test.end()
  })
})


test('internal webhooks - remove webhook', function(test) {
  
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  }

  var body = {
    url: 'http://www.example.com/hook'
  }

  STR_CLIENT.post(options, body, function(err, req, res, data) {

    var webhook_id = crypto.createHash('sha1').update('http://www.example.com/hook').digest('hex')

    var options = {
      path: '/webhooks/base/debian/' + webhook_id,
      headers: {
        authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
      }
    }
    STR_CLIENT.del(options, function(err, req, res, data) {
      test.ifError(err)
      test.ok(req)
      test.ok(res)
      test.equal(res.statusCode, 200)
      test.equal(res.body, '{"message":"webhook deleted","id":"d55ecc09f4cd1779d592b7c7f4bf3006fcb62a4c"}')
      test.end()
    })
  })
})


test('internal webhooks - tear down', function(t) {
  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-iwebhooksdb', function() {
      t.end()
    })
  })
})
