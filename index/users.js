var crypto = require('crypto');
var config = require('config');

module.exports = function(redis, logger) {
  return {
    createUser: function (req, res, next) {
      redis.get("user:" + req.body.username, function(err, value) {
        if (err) {
          res.send(500, err);
          return next();
        }

        var user = JSON.parse(value) || {};

        // Check to make sure a user was found.
        /*
        if (user.length == 0) {
          res.send(403, {message: "bad username and/or password (1)"});
          return next();
        }
        */
        
        var shasum = crypto.createHash("sha1");
        shasum.update(req.body.password);
        var sha1 = shasum.digest("hex");

        var userObj = {};

        userObj.username = req.body.username;
        userObj.password = sha1;
        userObj.email = req.body.email;

        // Check to make sure the password is valid.
        if (userObj.password != sha1) {
          res.send(403, {message: "bad username and/or password (2)"});
          return next();
        }

        if (config.private == true)
          userObj.disabled = true;

        redis.set("user:" + userObj.username, JSON.stringify(userObj), function(err, status) {
          if (err) {
            res.send(500, err);
            return next();
          }

          res.send(201);
          return next();
        });
      });
    },
    
    updateUser: function (req, res, next) {
      redis.get("user:" + req.params.username, function(err, value) {
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

        redis.set("_user_" + req.params.username, JSON.stringify(user), function(err, status) {
          if (err) {
            res.send(500, err);
            return next();
          }
    
          res.send(204);
          return next();
        });
      });
    }

  }
};

