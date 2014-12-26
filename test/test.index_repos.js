var domain = require('domain');
var once = require('once');
var restify = require('restify');
var util = require('util');
var datastore = require('../app/datastore/index.js')

var client = datastore({path: './test/ixreposdb'});

var config = {
  tokens: {
    expiration: 100
  }
};

var logger = {
  debug: function(msg) {  },
  error: function(msg) {  }
}

var repos  = require('../index/repos')(config, client, logger);
var middle = require('../index/middleware')(config, client, logger);

var SERVER;
var STR_CLIENT;
var JSON_CLIENT;

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

  SERVER.put('/v1/repositories/:repo', middle.requireAuth, repos.repoPut);
  SERVER.put('/v1/repositories/:namespace/:repo', middle.requireAuth, repos.repoPut);

  SERVER.listen(9999, '127.0.0.1', function() {
      /*STR_CLIENT = restify.createStringClient({
          url: 'http://127.0.0.1:9999',
          retry: false
      });*/
      
      JSON_CLIENT = restify.createJsonClient({
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
      });

      done()
  });
};

exports.tearDown = function(done) {
  client.createKeyStream().on('data', function(data) { client.del(data); });
  JSON_CLIENT.close();
  SERVER.close(done);
}

exports.RepoPut = function(test) {
  var options = {
    path: '/v1/repositories/base/debian',
    headers: {
      authorization: util.format('Basic %s', new Buffer("testing:testing").toString('base64'))
    }
  };
  
  var layers = [
    {id: "9e89cc6f0bc3c38722009fe6857087b486531f9a779a0c17e3ed29dae8f12c4f"},
    {id: "9e89cc6f0bc3c38722009fe6857087b486531f9a779a0c17e3ed29dae8f12c4g", Tag: 'latest'}
  ];

  JSON_CLIENT.put(options, layers, function(err, req, res, data) {
    test.ifError(err);
    test.ok(req);
    test.ok(res);
    test.equal(res.statusCode, 200);

    client.get(client.key('images', 'base', 'debian'), function(err, images) {
      test.ifError(err);
      test.equal(JSON.stringify(images), JSON.stringify(layers));
      test.done();
    })
  });
};
