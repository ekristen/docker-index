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
        var user  = creds[0];
        var pass  = creds[1];

        var shasum = crypto.createHash('sha1');
        shasum.update(pass);
        var sha1pwd = shasum.digest('hex');

        redis.get("users:" + user, function(err, value) {
          if (err) {
            logger.error({err: err, user: user});
            res.send(500, err);
            return next(false);
          }

          if (value == null) {
            res.send(403, {message: 'access denied'})
            return next(false);
          }
        
          value = JSON.parse(value);

          // If the account is disabled, do not let it do anything at all
          if (value.disabled == true || value.disabled == "true") {
            logger.debug({message: "account is disabled", user: value.username});
            res.send(403, {message: 'access denied'})
            return next(false);
          }

          if (value.password == sha1pwd) {
            req.username = user;
            req.admin = value.admin || false;

            return next();
          }
          else {
            res.send(403, {message: 'access denied'});
            return next(false);
          }
        });
      }
      else if (auth[0] == 'Token' && req.url == '/users') {
        req.authmethod = 'token';

        redis.get('_initial_auth_token', function(err, value) {
          if (err) {
            logger.error({err: err, user: user});
            res.send(500, err);
            return next(false);
          }

          if (value == auth[1]) {
            return next();
          }
          
          res.send(403, {message: 'access denied'});
          return next(false);
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

      var user_key = util.format('users:%s', req.username);

      redis.get(user_key, function(err, user) {
        next.ifError(err);
        
        var userobj = JSON.parse(user);

        var permissions = userobj.permissions;
        
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
