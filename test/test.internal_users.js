var fakeredis = require('fakeredis');
var request = require('supertest');
var restify = require('restify');

var logger = {
  debug: function() { },
  error: function() { }
}

var client = fakeredis.createClient();

var users = require('../internal/users')(client, logger);

var SERVER;
var STR_CLIENT;

exports.setUp = function(done) {
  client.set('users:testing', JSON.stringify({
    username: 'testing',
    password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
    email: 'testing@testing.com',
    disabled: false,
    admin: true,
    permissions: {
      'testing': 'admin'
    }
  }));
  client.sadd('users', 'testing');
  
  client.set('users:testing2', JSON.stringify({
    username: 'testing2',
    password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
    email: 'testing2@testing.com',
    disabled: true,
    permissions: {
      'testing': 'admin'
    }
  }));
  client.sadd('users', 'testing2');
  
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

  SERVER.get('/users', users.listUsers);
  SERVER.post('/users', users.createUser);
  SERVER.get('/users/:username', users.getUser);
  SERVER.get('/users/:username/enable', users.enableUser);
  SERVER.get('/users/:username/disable', users.disableUser);
  SERVER.get('/users/:username/permissions', users.getUserPermissions);
  SERVER.put('/users/:username/permissions', users.addUserPermission);
  SERVER.del('/users/:username/permissions/:repo', users.removeUserPermission);

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
};

exports.ListUsers = function(test) {
  STR_CLIENT.get('/users', function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.body, JSON.stringify(['testing', 'testing2']));
    test.done();
  });
};

exports.GetValidUser = function(test) {
  STR_CLIENT.get('/users/testing', function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.body, '{"username":"testing","email":"testing@testing.com","disabled":false,"admin":true,"permissions":{"testing":"admin"}}');
    test.done();
  });
};

exports.GetInvalidUser = function(test) {
  STR_CLIENT.get('/users/testing5', function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 404);
    test.equal(res.body, '{"message":"invalid user","error":false}');
    test.done();
  });
};

exports.EnableUser = function(test) {
  STR_CLIENT.get('/users/testing/enable', function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 201);
    test.equal(res.body, '{"message":"account enabled","user":"testing"}');
    test.done();
  });
};

exports.EnableInvalidUser = function(test) {
  STR_CLIENT.get('/users/testing5/enable', function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 409);
    test.equal(res.body, '{"message":"user does not exist","error":true}');
    test.done();
  });
};

exports.DisableUser = function(test) {
  STR_CLIENT.get('/users/testing/disable', function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 201);
    test.equal(res.body, '{"message":"account disabled","user":"testing"}');
    test.done();
  });
};

exports.DisableInvalidUser = function(test) {
  STR_CLIENT.get('/users/testing5/disable', function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 409);
    test.equal(res.body, '{"message":"user does not exist","error":true}');
    test.done();
  });
};

exports.GetUserPermissions = function(test) {
  STR_CLIENT.get('/users/testing/permissions', function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '{"testing":"admin"}');
    test.done();
  });
};

exports.GetInvalidUserPermissions = function(test) {
  STR_CLIENT.get('/users/testing5/permissions', function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 404);
    test.equal(res.body, '{"message":"invalid user","error":false}');
    test.done();
  });
};

exports.AddUserPermissions = function(test) {
  var body = 'repo=awesome&access=admin';
  STR_CLIENT.put('/users/testing/permissions', body, function(err, req, res, data) {
    test.ifError(err);
    test.equal(res.statusCode, 202)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"success":true}');
    test.done();
  });
};

exports.AddInvalidUserPermissions = function(test) {
  var body = 'repo=awesome&access=admin';
  STR_CLIENT.put('/users/testing5/permissions', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 404)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"message":"invalid user"}');
    test.done();
  });
};

exports.RemoveUserPermissions = function(test) {
  STR_CLIENT.del('/users/testing/permissions/awesome', function(err, req, res, data) {
    test.ifError(err);
    test.equal(res.statusCode, 200)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"success":true}');
    test.done();
  });
};

exports.RemoveInvalidUserPermissions = function(test) {
  STR_CLIENT.del('/users/testing5/permissions/awesome', function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 404)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"message":"invalid user"}');
    test.done();
  });
};

exports.CreateUser = function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing.com';
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ifError(err);
    test.equal(res.statusCode, 201)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"message":"account created","user":"testing3"}');
    test.done();
  });
};

exports.CreateExistingUser = function(test) {
  var body = 'username=testing3&password=testing3&email=testing3@testing.com';
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 409)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"messsage":"user already exists","error":false}');
    test.done();
  });
};

exports.CreateUserMissingUsernameField = function(test) {
  var body = 'password=testing3&email=testing3@testing.com';
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 409)
    test.ok(res);
    test.ok(req);
    test.equal(data, 'username field is required');
    test.done();
  });
};

exports.CreateUserMissingPasswordField = function(test) {
  var body = 'username=testing3&email=testing3@testing.com';
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 409)
    test.ok(res);
    test.ok(req);
    test.equal(data, 'password field is required');
    test.done();
  });
};

exports.CreateUserMissingEmailField = function(test) {
  var body = 'username=testing3&password=testing3';
  STR_CLIENT.post('/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 409)
    test.ok(res);
    test.ok(req);
    test.equal(data, 'email field is required');
    test.done();
  });
};



process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err);
});
