var domain = require('domain');
var once = require('once');
var fakeredis = require('fakeredis');
var restify = require('restify');
var config = require('config');

var client = fakeredis.createClient();

var users = require('../index/users')(client);

var SERVER;
var STR_CLIENT;

exports.setUp = function(done) {
  client.set('users:testing', JSON.stringify({
    username: 'testing',
    password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
    email: 'testing@testing.com',
    disabled: false,
    permissions: {
      'testing': 'admin'
    }
  }));
  
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
}

exports.CreateUser = function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing3.com';
  STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.body, data);
    test.done();
  });
};

exports.AccountIsDisabled = function(test) {
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
};

exports.UserAlreadyExists = function(test) {
  var body = 'username=testing&password=testing3&email=testing@testing.com';
  STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 400)
    test.ok(res);
    test.ok(req);
    test.equal(data, 'Username or email already exists');
    test.done();
  });
};

exports.LoginSuccessful = function(test) {
  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.equal(res.statusCode, 200)
    test.ok(res);
    test.ok(req);
    test.done();
  });
};

exports.BadUsernamePassword = function(test) {
  var options = {
    path: '/v1/users',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing3").toString('base64')
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
};


exports.tearDown = function(done) {
  STR_CLIENT.close();
  SERVER.close(done);
}
