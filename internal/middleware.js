var crypto = require('crypto');

module.exports = function(config, redis, logger) {

  return {
    requireAuth: function (req, res, next) {
      if (!req.headers.authorization) {
        res.send(401, 'authorization required');
        return next();
      }

      var auth = req.headers.authorization.split(' ');

      if (auth[0] == 'Basic') {
        req.authmethod = 'basic';

        var buff  = new Buffer(auth[1], 'base64');
        var plain = buff.toString();
        var creds = plain.split(':');
        var user  = creds[0];
        var pass  = creds[1];

        var shasum = crypto.createHash('sha1');
        shasum.update(pass);
        var sha1pwd = shasum.digest('hex');

        redis.get("user:" + user, function(err, value) {
          if (err) {
            logger.error({err: err, user: user});
            res.send(500, err);
            return next();
          }

          if (value == null) {
            res.send(403, 'access denied (1)')
            return next();
          }
        
          value = JSON.parse(value);

          if (value.password == sha1pwd) {
            req.username = user;

            if (value.admin == true || value.admin == "true") {
              req.admin = true;
            }
            else {
              logger.debug({message: 'access denied, no admin value set'});
              res.send(403, {message: 'access denied'});
            }
            
            return next();
          }
          else {
            res.send(401, 'Authorization required');
            return next();
          }
        });
      }
      else if (auth[0] == 'Token' && req.url == '/users') {
        req.authmethod = 'token';

        redis.get('_initial_auth_token', function(err, value) {
          if (err) {
            logger.error({err: err, user: user});
            res.send(500, err);
            return next();
          }

          if (value == auth[1]) {
            return next();
          }
          
          res.send(403, {message: 'access denied (4)'});
          return next();
        });
      }
      else {
        res.send(401, 'authorization required');
        return next();
      }
    }
  }
}
