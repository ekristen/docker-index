var redis = require('redis-mock');
var request = require('supertest');
var restify = require('restify');

redis._expireCheck = function () {
  this._toggleExpireCheck(false);
}
redis._toggleExpireCheck = function () {}

var logger = {
  debug: function() { },
  error: function() { }
}

exports.setUp = function(done) {
  this.r = redis.createClient();
  this.users = require('../internal/users.js')(this.r, logger);
  this.app = restify.createServer({
    name: 'docker-index',
    version: '1.0.0'
  });

  done();
}

exports.tearDown = function(done) {
  this.r.end();
  done();
}

exports.createUser = function(test) {
  request(this.app).post('/user')
};