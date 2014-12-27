var crypto = require('crypto');

module.exports = function(config, redis, logger) {

  return {

    generateToken: function (repo, access, cb) {
      var shasum = crypto.createHash('sha1');
      shasum.update(Math.random().toString(36));
      shasum.update(Math.random().toString(36));
      shasum.update(Math.random().toString(36));
  
      var sha1 = shasum.digest('hex');

      redis.put(redis.key('tokens', sha1), {repo: repo, access: access}, { ttl: config.tokens.expiration * 1000 }, function(err, status) {
        if (err) {
          logger.error({err: err, function: 'generateToken'});
          return cb(err);
        }

        // Set an expiration so that in the event of a server error
        // the token is deleted automatically at some point
        /*
        redis.expire(redis.key('tokens', sha1), config.tokens.expiration * 1000, function(err, status) {
          if (err) {
            logger.error({err: err, function: 'generateToken'});
            return cb(err);
          }
        */
          cb(null, sha1);
          //});
      });
    },

  }
}
