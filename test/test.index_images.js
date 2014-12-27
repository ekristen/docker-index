var domain = require('domain');
var once = require('once');
var restify = require('restify');
var util = require('util');
var datastore = require('../app/datastore/index.js')

var client = datastore({path: './test/iximagesdb'});

var config = {
  tokens: {
    expiration: 100
  }
};

var logger = {
  debug: function(msg) {  },
  error: function(msg) {  }
}

var helper = require('../index/helpers')(config, client, logger);
var images = require('../index/images')(config, client, logger);
var middle = require('../index/middleware')(config, client, logger);

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
        done();
      });
  });
};

exports.tearDown = function(done) {
  client.createKeyStream({ sync: true }).on('data', function(data) { client.del(data); });
  STR_CLIENT.close();
  SERVER.close(done);
}

exports.ImagesTests = {
  PutImages: function(test) {
    var options = {
      path: '/v1/repositories/base/debian/images',
      headers: {
        authorization: util.format('Basic %s', new Buffer("testing:testing").toString('base64'))
      }
    };

    STR_CLIENT.put(options, function(err, req, res, data) {
      test.ifError(err);
      test.ok(req);
      test.ok(res);
      test.done();
    });
  },
  
  GetImages: function(test) {
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
          test.ifError(err);
          test.ok(req);
          test.ok(res);
          test.done();
        });

      });
    });
  }
}
