var async = require('async');

module.exports = function(config, redis) {

  redis.get('version', function(err, version) {
    if (version == null) {
      async.series([
        function(cb) {
          redis.set('version', config.version);
          cb();
        },
        function(cb) {
          redis.keys("user:*", function(err, users) {
            async.each(users, function(user, ecb) {
              redis.get(user, function(err, value) {
                var info = user.split(':');

                redis.set("users:" + info[1], value, function(err, result) {
                  redis.del(user, function(err) {
                    ecb();
                  });
                });
              });
            }, function(err) {
              cb();
            })
          });
        }
      ], function (err, results) {
        console.log('upgrade complete')
      });
    }
  });
  
};
