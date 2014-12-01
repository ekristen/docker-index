var domain = require('domain');
var once = require('once');
var fakeredis = require('fakeredis');

exports.setUp = function(done) {
  this.r = fakeredis.createClient();
  this.helpers = require('../index/helpers.js')(this.r);
  done();
}

exports.tearDown = function(done) {
  this.r.end();
  done();
}

exports.GenerateToken = function(test) {
  this.helpers.generateToken('test_repo', 'test_access', function(err, token) {
    test.ok(token, "token generated");
    test.done();
  });
};
