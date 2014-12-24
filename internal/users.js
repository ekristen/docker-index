var _ = require('underscore');
var crypto = require('crypto');
var restify = require('restify');

module.exports = function(redis, logger) {

  var endpoints = {};

  endpoints.listUsers = function(req, res, next) {
    var users = [];
    redis.createKeyStream({
      gte: '!users'
    })
    .on('data', function(key) {
      users.push(key.split('!')[2]);
    })
    .on('end', function() {
      res.send(200, users);
      return next();
    });
  };

  endpoints.getUser = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {message: error, error: true});
        return next();
      }

      if ((err && err.status == '404') || user == null) {
        res.send(404, {message: 'invalid user', error: false});
        return next();
      }

      var user_object = user;

      delete user_object.password;

      res.send(200, user_object);
      return next();
    })
  };

  endpoints.getUserPermissions = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {message: error, error: true});
        return next();
      }

      if ((err && err.status == '404') || user == null) {
        res.send(404, {message: 'invalid user', error: false});
        return next();
      }

      res.send(200, user.permissions);
      return next();
    })
  };

  endpoints.addUserPermission = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {err: err, error: true})
        return next();
      }

      if ((err && err.status == '404') || user == null) {
        res.send(404, {message: 'invalid user'});
        return next();
      }
      
      if (!user.permissions) {
        user.permissions = {};
      }

      user.permissions[req.body.repo] = req.body.access;

      redis.set(redis.key('users', req.params.username), user, function(err) {
        res.send(202, {success: true});
        return next();
      });
    });
  };
  
  endpoints.removeUserPermission = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {err: err, error: true})
        return next();
      }

      if ((err && err.status == '404') || user == null) {
        res.send(404, {message: 'invalid user'});
        return next();
      }

      delete user.permissions[req.params.repo];

      redis.set(redis.key('users', req.params.username), user, function(err) {
        if (err) {
          res.send(500, {error: true, error: err});
          return next();
        }

        res.send(200, {success: true});
        return next();
      });
    });
  };

  endpoints.createUser = function(req, res, next) {
    if (!req.body.username) {
      return next(new restify.errors.MissingParameterError("username field is required"));
    }
    if (!req.body.password) {
      return next(new restify.errors.MissingParameterError("password field is required"));
    }
    if (!req.body.email) {
      return next(new restify.errors.MissingParameterError("email field is required"));
    }

    redis.get(redis.key('users', req.body.username), function(err, user) {
      if (err && err.status != '404') {
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

      redis.set(redis.key('users', req.body.username), userObj, function(err) {
        if (err) {
          logger.error({err: err}, "Redis Error -- Unable to Set Key");
          res.send(500, {err: err});
          return next();
        }

        res.send(201, {message: "account created", user: req.body.username});
        return next();
      });
    });
  };

  endpoints.enableUser = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {message: err, error: true});
        return next();
      }

      if ((err && err.status == '404') || user == null) {
        res.send(409, {message: 'user does not exist', error: true});
        return next();
      }
      
      user.disabled = false;
      
      redis.set(redis.key('users', req.params.username), user, function(err) {
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

  endpoints.disableUser = function(req, res, next) {
    redis.get(redis.key('users', req.params.username), function(err, user) {
      if (err && err.status != '404') {
        res.send(500, {message: err, error: true});
        return next();
      }
      
      if ((err && err.status == '404') && user == null) {
        res.send(409, {message: 'user does not exist', error: true});
        return next();
      }

      user.disabled = true;
      
      redis.set(redis.key('users', req.params.username), user, function(err) {
        if (err) {
          logger.error({err: err}, "Redis Error -- Unable to Set Key");
          res.send(500, {err: err});
          return next();
        }
        
        res.send(201, {message: "account disabled", user: req.params.username});
        return next();
      })
    })
  };

  return endpoints;

};

