var domain = require('domain');
var once = require('once');
var redis = require('redis-mock');

redis._expireCheck = function () {
  this._toggleExpireCheck(false);
}
redis._toggleExpireCheck = function () {}

exports.setUp = function(done) {
  this.r = redis.createClient();
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