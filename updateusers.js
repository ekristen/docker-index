var config = require('config');
var redis = require('redis').createClient(config.redis.port, config.redis.host);
var async = require('async');

async.series([
  function(cb) {
    redis.smembers('users', function(err, users) {
      if (typeof(users) != "undefined") {
        for (var i = 0; i < users.length; i++) {
          redis.del('user:' + users[i]);
          redis.srem('users', users[i]);
        }
      }
      
      cb(null);
    });
  },
  function(cb) {
    // Add new user from config file.
    for (var i = 0; i<config.users.length; i++) {
      redis.set("user:" + config.users[i].username, JSON.stringify(config.users[i]));
      redis.sadd("users", config.users[i].username);
      console.log(config.users[i].password);
    }

    cb(null);
  }
], function(err) {
  redis.quit();
});