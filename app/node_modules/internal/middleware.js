var crypto = require('crypto');
var util = require('util');

module.exports = function(config, redis, logger) {

  return {
    requireAuth: function (req, res, next) {
      if (!req.headers.authorization) {
        res.send(401, {message: 'authorization required'});
        return next(false);
      }

      req.username = 'anonymous';
      req.admin = false;

      var auth = req.headers.authorization.split(' ');

      if (auth[0] == 'Basic') {
        req.authmethod = 'basic';

        var buff  = new Buffer(auth[1], 'base64');
        var plain = buff.toString();
        var creds = plain.split(':');
        var username  = creds[0];
        var password  = creds[1];

        var shasum = crypto.createHash('sha1');
        shasum.update(password);
        var sha1pwd = shasum.digest('hex');

        redis.get(redis.key('users', username), function(err, user) {
          if (err && err.status != '404') {
            logger.error({err: err, user: user});
            res.send(500, err);
            return next(false);
          }

          if ((err && err.status == '404') || user == null) {
            res.send(403, {message: 'access denied'})
            return next(false);
          }

          // If the account is disabled, do not let it do anything at all
          if (user.disabled == true || user.disabled == "true") {
            logger.debug({message: "account is disabled", user: user.username});
            res.send(403, {message: 'access denied'})
            return next(false);
          }

          if (user.password == sha1pwd) {
            req.username = user.username;
            req.admin = user.admin || false;

            return next();
          }
          else {
            res.send(403, {message: 'access denied'});
            return next(false);
          }
        });
      }
      else {
        res.send(401, {message: 'authorization required'});
        return next(false);
      }
    },

    requireAdmin: function(req, res, next) {
      if (req.admin == false) {
        logger.debug({message: 'access denied, no admin value set'});
        res.send(403, {message: 'access denied'});
        return next(false);
      }
      
      return next();
    },

    // Check to make sure user has admin or write privileges
    requireRepoAccess: function (req, res, next) {
      if (req.username == null) {
        return next(false);
      }

      if (req.admin == true) {
        return next();
      }

      redis.get(redis.key('users', req.username), function(err, user) {
        next.ifError(err);
        
        var permissions = user.permissions;
        
        var access = permissions[req.params.namespace] || permissions[req.params.namespace + '_' + req.params.repo] || false;
        
        if (access == false || access == 'read') {
          res.send(403, {message: 'access denied'});
          return next(false);
        }

        return next(); 
      });
    }

  }

};
