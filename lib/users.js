var crypto = require('crypto');

module.exports = function(redis) {
  return {
    createUser: function (req, res, next) {
      redis.get("user:" + req.body.username, function(err, value) {
        if (err) {
          res.send(500, err);
          return next();
        }

        var user = JSON.parse(value) || {};

        // Check to make sure a user was found.
        if (user.length == 0) {
          res.send(403, {message: "bad username and/or password (1)"});
          return next();
        }

        var shasum = crypto.createHash("sha1");
        shasum.update(req.body.password);
        var sha1 = shasum.digest("hex");

        // Check to make sure the password is valid.
        if (user.password != sha1) {
          res.send(403, {message: "bad username and/or password (2)"});
          return next();
        }

        user.password = sha1;
        user.email = req.body.email;

        redis.set("user:" + req.body.username, JSON.stringify(user), function(err, status) {
          if (err) {
            res.send(500, err);
            return next();
          }

          res.send(201);
          return next();
        });
      });
    }
  }
};

