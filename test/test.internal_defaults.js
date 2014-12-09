var fakeredis = require('fakeredis');
var request = require('supertest');
var restify = require('restify');
var crypto = require('crypto');

var logger = {
  debug: function() { },
  error: function() { }
}

var client = fakeredis.createClient();

var defaults = require('../index/defaults')({test: true}, client, logger);

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
    email: 'testing2@testing2.com',
    admin: false,
    disabled: false,
    permissions: {}
  }));
  client.sadd('users', 'anonymous');
  
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

  SERVER.get('/v1', defaults.ping);
  SERVER.get('/v1/_ping', defaults.ping);

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

exports.TestRoot = function(test) {
  var options = {
    path: '/v1'
  };
  
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, "");
    test.done();
  });
};

exports.TestPing = function(test) {
  var options = {
    path: '/v1/_ping'
  };

  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, "");
    test.done();
  });
};
