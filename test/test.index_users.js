var domain = require('domain');
var once = require('once');
var redis = require('redis-mock');
var restify = require('restify');

redis._expireCheck = function () {
  this._toggleExpireCheck(false);
}
redis._toggleExpireCheck = function () {}


var client = redis.createClient();

var users = require('../index/users')(client);

var SERVER;
var STR_CLIENT;

exports.setUp = function(done) {
  client.set('users:testing', JSON.stringify({
    username: 'testing',
    password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
    email: 'testing@testing.com',
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

exports.BadUsernamePassword = function(test) {
  var body = 'username=testing&password=testing123&email=testing@testing.com';
  STR_CLIENT.post('/v1/users', body, function(err, req, res, data) {
    test.ok(err);
    test.equal(res.statusCode, 400)
    test.ok(res);
    test.ok(req);
    test.equal(data, '{"message":"bad username and/or password (3)"}');
    test.done();
  });
};


exports.tearDown = function(done) {
  STR_CLIENT.close();
  client.end();
  SERVER.close(done);
}