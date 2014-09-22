var _ = require('underscore');
var crypto = require('crypto');

module.exports = function(redis, logger) {

  var endpoints = {};

  endpoints.listUsers = function(req, res, next) {
    redis.smembers('users', function(err, members) {
      res.send(200, members);
      return next();
    });
  };

  endpoints.getUser = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, user) {
      if (err) {
        res.send(500, {message: error, error: true});
        return next();
      }

      if (user == null) {
        res.send(404, {message: 'invalid user', error: false});
        return next();
      }

      var user_object = JSON.parse(user);

      delete user_object.password;

      res.send(200, user_object);
      return next();
    })
  };

  endpoints.getUserPermissions = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, user) {
      if (err) {
        res.send(500, {message: error, error: true});
        return next();
      }

      if (user == null) {
        res.send(404, {message: 'invalid user', error: false});
        return next();
      }

      var user_object = JSON.parse(user);

      res.send(200, user_object.permissions);
      return next();
    })
  };

  endpoints.addUserPermission = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, get_user) {
      var user = JSON.parse(get_user);
      
      if (!user.permissions) {
        user.permissions = {};
      }

      user.permissions[req.body.repo] = req.body.access;

      redis.set('user:' + req.params.username, JSON.stringify(user), function(err) {
        res.send(202, {success: true});
        return next();
      });
    });
  };

  endpoints.updateUserPermission = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, get_user) {
      var user = JSON.parse(get_user);

      user.permissions[req.params.repo] = req.body.access;

      redis.set('user:' + req.params.username, JSON.stringify(user), function(err) {
        res.send(202, {success: true});
        return next();
      });
    });
  };
  
  endpoints.removeUserPermission = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, get_user) {
      var user = JSON.parse(get_user);

      delete user.permissions[req.params.repo];

      redis.set('user:' + req.params.username, JSON.stringify(user), function(err) {
        if (err) {
          res.send(500, {success: false, error: err});
          return next();
        }

        res.send(200, {success: true});
        return next();
      });
    });
  };


  endpoints.createUser = function(req, res, next) {
    redis.get('user:' + req.body.username, function(err, user) {
      if (err) {
        res.send(500, {message: err, error: true});
        return next();
      }
      
      if (user != null) {
        res.send(409, {messsage: 'user already exists', error: false});
        return next();
      }

      var shasum = crypto.createHash('sha1');
      shasum.update(req.body.password);
      var sha1pwd = shasum.digest('hex');

      var userObj = {
        username: req.body.username,
        password: sha1pwd,
        email: req.body.email,
        permissions: {},
        admin: req.body.admin || false
      };

      redis.set('user:' + req.body.username, JSON.stringify(userObj), function(err) {
        if (err) {
          logger.error({err: err}, "Redis Error -- Unable to Set Key");
          res.send(500, {err: err});
          return next();
        }

        redis.sadd('users', req.body.username, function(err) {
          if (err) {
            logger.error({err: err}, "Redis Error -- Unable to Set Key");
            res.send(500, {err: err});
            return next();
          }

          if (req.authmethod == 'token') {
            redis.del('_initial_auth_token', function(err) {})
          }

          res.send(201, {message: "account created", user: req.body.username});
          return next();
        });
      });
    });
  };

  endpoints.enableDisableUser = function(req, res, next) {
    redis.get('user:' + req.params.username, function(err, user) {
      if (err) {
        res.send(500, {message: err, error: true});
        return next();
      }
      
      if (user == null) {
        res.send(409, {message: 'user does not exist', error: true});
        return next();
      }
      
      var userObj = user;

      if (req.path.indexOf('enable') !== -1) {
        userObj.disabled = false;
      } else {
        userObj.disabled = true;
      }
      
      redis.set('user:' + req.params.username, JSON.stringify(userObj), function(err) {
        if (err) {
          logger.error({err: err}, "Redis Error -- Unable to Set Key");
          res.send(500, {err: err});
          return next();
        }
        
        res.send(201, {message: "account enabled", user: req.params.username});
        return next();
      })
    })
  };

  return endpoints;

};

