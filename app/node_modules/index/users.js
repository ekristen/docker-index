var crypto = require('crypto');

module.exports = function(config, redis, logger) {
  return {
    createUser: function (req, res, next) {
      // Validate against a-z0-9_ regexx

      // Allow for account registrations to be disabled.
      // See: https://github.com/docker/docker/blob/fefaf6a73db52b6d20774f049d7456e2ba6ff5ca/registry/auth.go#L245
      if (config.disable_account_registration == true) {
        res.send(401);
        return next();
      }

      redis.get(redis.key('users', req.body.username), function(err, value) {
        if (err && err.status != "404") {
          res.send(500, err);
          return next();
        }

        if (value == null) {
          // User Does Not Exist, Create!
          var shasum = crypto.createHash("sha1");
          shasum.update(req.body.password);
          var sha1 = shasum.digest("hex");
          
          var userObj = {};

          userObj.username = req.body.username;
          userObj.password = sha1;
          userObj.email = req.body.email;
          userObj.permissions = {};

          if (config.private == true || config.disable_new_accounts == true)
            userObj.disabled = true;

          // Check to make sure the password is valid.
          if (userObj.password != sha1) {
            res.send(400, {message: "bad username and/or password (2)"});
            return next();
          }

          redis.set(redis.key('users', userObj.username), userObj, function(err, status) {
            if (err) {
              res.send(500, err);
              return next();
            }

            res.send(201, {message: 'account created successfully'});
            return next();
          });
        }
        else {
          res.send(400, 'Username or email already exists');
          return next();
        }
      });
    },
    
    updateUser: function (req, res, next) {
      redis.get(redis.key('users', req.params.username), function(err, value) {
        if (err) {
          res.send(500, err);
          return next();
        }

        var user = value || {};

        var shasum = crypto.createHash("sha1");
        shasum.update(req.body.password);
        var sha1 = shasum.digest("hex");

        user.password = sha1;
        user.email = req.body.email;

        redis.set(redis.key('users', req.params.username), user, function(err, status) {
          if (err) {
            res.send(500, err);
            return next();
          }

          res.send(204);
          return next();
        });
      });
    },
    
    validateUser: function(req, res, next) {
      if (!req.headers.authorization) {
        return res.send(401);
      }

      var auth = req.headers.authorization.split(' ');
      if (auth[0] == 'Basic') {
        var buff  = new Buffer(auth[1], 'base64');
        var plain = buff.toString();
        var creds = plain.split(':');
        var username  = creds[0];
        var password  = creds[1];

        redis.get(redis.key('users', username), function(err, value) {
          if (err && err.status != "404") {
            res.send(500, err);
            return next();
          }

          var user = value || {};

          var shasum = crypto.createHash("sha1");
          shasum.update(password);
          var sha1 = shasum.digest("hex");

          if (user.disabled == true) {
            // Account not active (https://github.com/docker/docker/blob/fefaf6a73db52b6d20774f049d7456e2ba6ff5ca/registry/auth.go#L235)
            res.send(403, {message: "account is not active"});
            return next();
          }

          // Check to make sure the password is valid.
          if (user.password != sha1) {
            // Bad login (https://github.com/docker/docker/blob/fefaf6a73db52b6d20774f049d7456e2ba6ff5ca/registry/auth.go#L233)
            res.send(401, {message: "bad username and/or password (2)"});
            return next();
          }

          // Login Succeeded (https://github.com/docker/docker/blob/fefaf6a73db52b6d20774f049d7456e2ba6ff5ca/registry/auth.go#L231)
          res.send(200);
          return next();
        });
      }
      else {
        // Bad login (https://github.com/docker/docker/blob/fefaf6a73db52b6d20774f049d7456e2ba6ff5ca/registry/auth.go#L233)
        res.send(401); 
        return next();
      }
    }

  }
};

