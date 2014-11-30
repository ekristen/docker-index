var fakeredis = require('fakeredis');
var request = require('supertest');
var restify = require('restify');
var crypto = require('crypto');

var logger = {
  debug: function() { },
  error: function() { }
}

var client = fakeredis.createClient();

var webhooks = require('../internal/webhooks')(client, logger);
var middleware = require('../internal/middleware')({}, client, logger);

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

  SERVER.get('/webhooks/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.listWebhooks);
  SERVER.get('/webhooks/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.listWebhooks);
  SERVER.post('/webhooks/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.addWebhook);
  SERVER.post('/webhooks/:namespace/:repo', middleware.requireAuth, middleware.requireRepoAccess, webhooks.addWebhook);
  SERVER.del('/webhooks/:repo/:webhook_id', middleware.requireAuth, middleware.requireRepoAccess, webhooks.removeWebhook);
  SERVER.del('/webhooks/:namespace/:repo/:webhook_id', middleware.requireAuth, middleware.requireRepoAccess, webhooks.removeWebhook);

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

exports.AddWebhook = function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  var body = {
    url: 'http://www.example.com/hook'
  };
  STR_CLIENT.post(options, body, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 201);
    test.equal(res.body, '{"message":"webhook created","id":"d55ecc09f4cd1779d592b7c7f4bf3006fcb62a4c"}');
    test.done();
  });
};

exports.ListWebhooks = function(test) {
  var options = {
    path: '/webhooks/base/debian',
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  STR_CLIENT.get(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '["http://www.example.com/hook"]');
    test.done();
  });
};

exports.RemoveWebhook = function(test) {
  var webhook_id = crypto.createHash('sha1').update('http://www.example.com/hook').digest('hex');

  var options = {
    path: '/webhooks/base/debian/' + webhook_id,
    headers: {
      authorization: 'Basic ' + new Buffer("testing:testing").toString('base64')
    }
  };
  STR_CLIENT.del(options, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);
    test.equal(res.body, '{"message":"webhook deleted"}');
    test.done();
  });
};
