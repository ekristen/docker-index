var crypto = require('crypto');

module.exports = function(redis) {
  return {

    generateToken: function (repo, access, cb) {
      var shasum = crypto.createHash('sha1');
      shasum.update(Math.random().toString(36));
      shasum.update(Math.random().toString(36));
      shasum.update(Math.random().toString(36));
  
      var sha1 = shasum.digest('hex');

      redis.set("token:" + sha1, JSON.stringify({repo: repo, access: access}), function(err, status) {
        if (err) cb(err);
        // TODO: better way to do this?
        // Set a 10 minute expiration, 10 minutes should be enough time to download images
        // in the case of a slow internet connection, this could be a problem, but we do not
        // want unused tokens remaining in the system either
        redis.expire("token:" + sha1, 600, function(err, status) {
          if (err) cb(err);

          cb(null, sha1);
        });
      });
    },

  }
}
