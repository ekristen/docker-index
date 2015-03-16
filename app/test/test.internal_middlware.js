var request = require('supertest');
var restify = require('restify');
var crypto = require('crypto');
var datastore = require('../app/datastore/index.js');
var path = require("path");
var fs = require('fs');

var logger = {
  debug: function() { },
  error: function() { }
}

var client = datastore({path: './test/imiddledb'});
client.createKeyStream({ sync: true }).on('data', function(key) { client.del(key) });

var middleware = require('../internal/middleware')({}, client, logger);

var SERVER;
var STR_CLIENT;

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

  function passed (req, res, next) {
    res.send(200, {message: 'success'});
  }

  SERVER.get('/require/auth', middleware.requireAuth, passed);
  SERVER.get('/require/admin', middleware.requireAuth, middleware.requireAdmin, passed);
  SERVER.get('/require/repo/:namespace', middleware.requireAuth, middleware.requireRepoAccess, passed);
  SERVER.get('/require/repo/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, passed);

  SERVER.listen(9999, '127.0.0.1', function() {
      STR_CLIENT = restify.createStringClient({
          url: 'http://127.0.0.1:9999',
          retry: false
      });

      var ws = client.createWriteStream();
      ws.on('close', function(err) {
        done();
      });
      ws.write({ key: client.key('users', 'testing'), value: {
        username: 'testing',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing@testing.com',
        disabled: false,
        admin: true,
        permissions: { 'testing': 'admin' }
      }});
      ws.write({ key: client.key('users', 'testing2'), value: {
        username: 'testing2',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing2@testing2.com',
        admin: false,
        disabled: true,
        permissions: {}
      }});
      ws.write({ key: client.key('users', 'testing3'), value: {
        username: 'testing3',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing3@testing3.com',
        admin: false,
        disabled: false,
        permissions: {
          'testing': 'admin'
        }
      }});
      ws.write({ key: client.key('users', 'testing4'), value: {
        username: 'testing4',
        password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
        email: 'testing3@testing3.com',
        admin: false,
        disabled: false,
        permissions: {
          'testing': 'read'
        }
      }});
      ws.end();
  });
};

exports.tearDown = function(done) {
  client.createKeyStream().on('data', function(key) { client.del(key); });
  STR_CLIENT.close();
  SERVER.close(done);
};

exports.InvalidUser = function(test) {
  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing5:testing5").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 403);
    test.equal(res.body, '{"message":"access denied"}');
    test.done();
  });
};

exports.InvalidCredentials = function(test) {
  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing3").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 403);
    test.equal(res.body, '{"message":"access denied"}');
    test.done();
  });
};

exports.MissingAuthenticationHeader = function(test) {
  var options = {
    path: '/require/auth',
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 401);
    test.equal(res.body, '{"message":"authorization required"}');
    test.done();
  });
};

exports.DisabledAccount = function(test) {
  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing2:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 403);
    test.equal(res.body, '{"message":"access denied"}');
    test.done();
  });
};

exports.ValidUser = function(test) {
  var options = {
    path: '/require/auth',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '{"message":"success"}');
    test.done();
  });
};


exports.ValidAdminUser = function(test) {
  var options = {
    path: '/require/admin',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '{"message":"success"}');
    test.done();
  });
};


exports.InvalidAdminUser = function(test) {
  var options = {
    path: '/require/admin',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 403);
    test.equal(res.body, '{"message":"access denied"}');
    test.done();
  });
};

exports.ValidRepoUser = function(test) {
  var options = {
    path: '/require/repo/testing',
    headers: {
      authorization: 'Basic ' + new Buffer("testing3:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '{"message":"success"}');
    test.done();
  });
};

exports.InvalidRepoUser = function(test) {
  var options = {
    path: '/require/repo/testing',
    headers: {
      authorization: 'Basic ' + new Buffer("testing4:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ok(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 403);
    test.equal(res.body, '{"message":"access denied"}');
    test.done();
  });
};

