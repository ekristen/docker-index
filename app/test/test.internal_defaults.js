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

var client = datastore({path: './tests-idefaultsdb'})

var defaults = require('index/defaults')({test: true}, client, logger)

var SERVER
var STR_CLIENT

test('internal defaults - setup', function(t) {
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

  SERVER.get('/v1', defaults.ping)
  SERVER.get('/v1/_ping', defaults.ping)

  SERVER.listen(9999, '127.0.0.1', function() {
    STR_CLIENT = restify.createStringClient({
      url: 'http://127.0.0.1:9999',
      retry: false
    })

    t.end()
  })
})


test('internal defaults - test root', function(t) {
  
  var options = {
    path: '/v1'
  }
  
  STR_CLIENT.get(options, function(err, req, res, data) {
    t.ifError(err, 'there should be no error')
    t.equal(res.statusCode, 200, 'status code should be 200')
    t.equal(res.body, "", 'the body should be empty')
    t.end()
  })
})

test('internal defaults - ping', function(t) {

  var options = {
    path: '/v1/_ping'
  }

  STR_CLIENT.get(options, function(err, req, res, data) {
    t.ifError(err, 'there should be no error')
    t.equal(res.headers['x-docker-registry-standalone'], 'false', 'registry should not be in standalone mode')
    t.equal(res.statusCode, 200, 'the status code should be 200')
    t.equal(res.body, '', 'the body should be empty')
    t.end()
  })
})


test('internal defaults - tear down', function(t) {
  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-idefaultsdb', function() {
      t.end()
    })
  })  
})
