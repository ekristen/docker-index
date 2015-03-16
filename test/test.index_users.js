var domain = require('domain');
var once = require('once');
var restify = require('restify');
var rimraf = require('rimraf');
var config = require('config');
var datastore = require('../app/datastore/index.js')

var client = datastore({path: './test/ixusersdb'});
client.createKeyStream({ sync: true }).on('data', function(key) { client.del(key) });

var users = require('../index/users')(config, client);

var SERVER;
var STR_CLIENT;

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

exports.setUp = function(done) {
  SERVER = restify.createServer({
    name: 'myapp',
    version: '1.0.0'
  });
  SERVER.use(restify.acceptParser(SERVER.acceptable));
  SERVER.use(restify.queryParser());
  SERVER.use(restify.bodyParser({
    mapParams: false,
    overrideParams: false
  }));

  SERVER.post('/v1/users', users.createUser);
  SERVER.get('/v1/users', users.validateUser);

  SERVER.listen(9999, '127.0.0.1', function() {
      STR_CLIENT = restify.createStringClient({
          url: 'http://127.0.0.1:9999',
          retry: false
      });

      done()
  });
};

exports.tearDown = function(done) {
  STR_CLIENT.close();
  SERVER.close(done);
}

exports.IndexUsers = {
  CreateUser: function(test) {
    var body = 'username=testing3&password=testing3&email=testing3@testing3.com';
    STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
      test.ifError(err);
      test.ok(req);
      test.ok(res);
      test.equal(res.body, data);
      test.done();
    });
  },
  
  AccountIsDisabled: function(test) {
    var options = {
      path: '/v1/users',
      headers: {
        authorization: 'Basic ' + new Buffer("testing3:testing3").toString('base64')
      }
    };
    STR_CLIENT.get(options, function(err, req, res, data) {
      test.equal(res.statusCode, 403)
      test.ok(res);
      test.ok(req);
      test.equal(data, '{"message":"account is not active"}');
      test.done();
    });
  },
  
  UserAlreadyExists: function(test) {
    var body = 'username=testing3&password=testing3&email=testing3@testing3.com';
    STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
      test.ok(err);
      test.equal(res.statusCode, 400)
      test.ok(res);
      test.ok(req);
      test.equal(data, 'Username or email already exists');
      test.done();
    });
  }, 
  
  LoginSuccessful: function(test) {
    client.get(client.key('users', 'testing3'), function(err, value) {
      value.disabled = false;
      client.put(client.key('users', 'testing3'), value);
    })
    
    var options = {
      path: '/v1/users',
      headers: {
        authorization: 'Basic ' + new Buffer("testing3:testing3").toString('base64')
      }
    };
    STR_CLIENT.get(options, function(err, req, res, data) {
      test.ifError(err);
      test.equal(res.statusCode, 200)
      test.ok(res);
      test.ok(req);
      test.done();
    });
  },

  BadUsernamePassword: function(test) {
    var options = {
      path: '/v1/users',
      headers: {
        authorization: 'Basic ' + new Buffer("testing3:testing4").toString('base64')
      }
    };
    STR_CLIENT.get(options, function(err, req, res, data) {
      test.ok(err);
      test.equal(res.statusCode, 401)
      test.ok(res);
      test.ok(req);
      test.equal(data, '{"message":"bad username and/or password (2)"}');
      test.done();
    });
  },
  
  NonExistentUser: function(test) {
    var options = {
      path: '/v1/users',
      headers: {
        authorization: 'Basic ' + new Buffer("testing2:testing2").toString('base64')
      }
    };
    STR_CLIENT.get(options, function(err, req, res, data) {
      test.ok(err);
      test.equal(res.statusCode, 401)
      test.ok(res);
      test.ok(req);
      test.equal(data, '{"message":"bad username and/or password (2)"}');
      test.done();
    });
  },
  
};
