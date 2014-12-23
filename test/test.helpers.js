var domain = require('domain');
var once = require('once');
var fakeredis = require('fakeredis');

var config = {
  tokens: {
    expiration: 600
  }
};

var logger = {};
logger.error = function() {};
logger.debug = function() {};

var client  = fakeredis.createClient();
var helpers = require('../index/helpers.js')(config, client, logger);

exports.GenerateToken = function(test) {
  helpers.generateToken('test_repo', 'test_access', function(err, token) {
    test.ok(token, "token generated");
    test.done();
  });
};
