var test = require('tape')
var rimraf = require('rimraf')
var restify = require('restify')
var util = require('util')

var datastore = require('datastore')

var client = datastore({path: './tests-iximagesdb'})

var config = {
  tokens: {
    expiration: 100
  }
}

var logger = {
  debug: function(msg) {  },
  error: function(msg) {  }
}

var helper = require('index/helpers')(config, client, logger);
var images = require('index/images')(config, client, logger);
var middle = require('index/middleware')(config, client, logger);

var SERVER;
var STR_CLIENT;

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

test('index images - setup', function(t) {
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

  SERVER.get('/v1/repositories/:repo/images', middle.requireAuth, images.repoImagesGet);
  SERVER.get('/v1/repositories/:namespace/:repo/images', middle.requireAuth, images.repoImagesGet);
  SERVER.put('/v1/repositories/:repo/images', middle.requireAuth, images.repoImagesPut);
  SERVER.put('/v1/repositories/:namespace/:repo/images', middle.requireAuth, images.repoImagesPut);

  SERVER.listen(9999, '127.0.0.1', function() {
    STR_CLIENT = restify.createStringClient({
      url: 'http://127.0.0.1:9999',
      retry: false
    });

    client.put(client.key('users', 'testing'), {
      username: 'testing',
      password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
      email: 'testing@testing.com',
      disabled: false,
      admin: true,
      permissions: {
        'testing': 'admin',
        'base': 'admin'
      }
    }, { sync: true }, function(err) {
      t.end()
    });
  });
})

test('index images - put images', function(t) {
  var options = {
    path: '/v1/repositories/base/debian/images',
    headers: {
      authorization: util.format('Basic %s', new Buffer("testing:testing").toString('base64'))
    }
  };

  STR_CLIENT.put(options, function(err, req, res, data) {
    t.ok(!err, 'there should be no error')
    t.ok(req, 'there should be a req object')
    t.ok(res, 'there should be a res object')
    t.ok(!data, 'there should be no data')
    t.end()
  });
})

test('index images - get images', function(t) {
  var layers = {};
  client.put(client.key('images', 'base', 'debian'), layers, { sync: true }, function(err, success) {
    helper.generateToken('base/debian', 'write', function(err, token) {

      var options = {
        path: '/v1/repositories/base/debian/images',
        headers: {
          authorization: util.format('Token signature=%s, repository="%s", access=%s', token, 'base/debian', 'write')
        }
      };

      STR_CLIENT.get(options, function(err, req, res, data) {
        t.ok(!err, 'there should be no error')
        t.ok(req, 'there should be a req object')
        t.ok(res, 'there should be a res object')
        t.ok(data, 'there should be data, but empty')
        t.end();
      });

    });
  });
})

test('index images - tear down', function(t) {
  STR_CLIENT.close()
  SERVER.close(function() {
    rimraf('./tests-iximagesdb', function() {
      t.end()
    })
  })
})
