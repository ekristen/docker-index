var test = require('tape')
var rimraf = require('rimraf')

// Local Modules
var datastore = require('datastore')

var config = {
  tokens: {
    expiration: 600
  }
}

var logger = {
  debug: function(msg) {  },
  error: function(msg) {  }
}

test('helpers - generate token', function(t) {
  var client = datastore({path: './tests-xhelpersdb'})
  var helpers = require('index/helpers')(config, client, logger)

  helpers.generateToken('test_repo', 'test_access', function(err, token) {
    t.ok(!err, 'should be no error')
    t.ok(token, 'token generated')
  })
  
  rimraf('./tests-xhelpersdb', function() {
    t.end()
  })
})

