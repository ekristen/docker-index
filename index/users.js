var crypto = require('crypto');
var config = require('config');

module.exports = function(redis, logger) {
  return {
    createUser: function (req, res, next) {
      // Validate against a-z0-9_ regexx
            
      redis.get("users:" + req.body.username, function(err, value) {
        if (err) {
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

          if (config.private == true)
            userObj.disabled = true;

          // Check to make sure the password is valid.
          if (userObj.password != sha1) {
            res.send(400, {message: "bad username and/or password (2)"});
            return next();
          }

          redis.set("users:" + userObj.username, JSON.stringify(userObj), function(err, status) {
            if (err) {
              res.send(500, err);
              return next();
            }

            res.send(201, {message: 'account created successfully'});
            return next();
          });
        }
        else {
          var user = JSON.parse(value) || {};

          var shasum = crypto.createHash("sha1");
          shasum.update(req.body.password);
          var sha1 = shasum.digest("hex");

          var userObj = user;

          if (userObj.password != sha1) {
            res.send(400, {message: "bad username and/or password (3)"});
            return next();
          }
          else {
            res.send(201, {message: 'authentication successful'});
            return next();
          }

        }
      });
    },
    
    updateUser: function (req, res, next) {
      redis.get("users:" + req.params.username, function(err, value) {
        if (err) {
          res.send(500, err);
          return next();
        }

        var user = JSON.parse(value) || {};

        var shasum = crypto.createHash("sha1");
        shasum.update(req.body.password);
        var sha1 = shasum.digest("hex");

        user.password = sha1;
        user.email = req.body.email;

        redis.set("users:" + req.params.username, JSON.stringify(user), function(err, status) {
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

        redis.get("users:" + user, function(err, value) {
          if (err) {
            res.send(500, err);
            return next();
          }
          
          var user = JSON.parse(value) || {};

          var shasum = crypto.createHash("sha1");
          shasum.update(req.body.password);
          var sha1 = shasum.digest("hex");

          if (user.disabled == true) {
            return res.send(403, {message: "account is not active"});
          }

          // Check to make sure the password is valid.
          if (user.password != sha1) {
            return res.send(401, {message: "bad username and/or password (2)"});
          }

          return res.send(200);
        });
      }

      return res.send(401);
    }

  }
};

