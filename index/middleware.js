var crypto = require('crypto');
var util = require('util');

module.exports = function(config, redis, logger) {
  var index_helpers = require('./helpers.js')(config, redis);

  return {
    requireAuth: function (req, res, next) {
      if (!req.headers.authorization) {
        res.send(401, 'authorization required');
        return next();
      }

      if (!req.params.namespace)
        req.params.namespace = 'library';

      var auth = req.headers.authorization.split(' ');

      logger.debug({headers: req.headers, url: req.url});

      if (auth[0] == 'Basic') {
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
            return next();
          }

          if (value == null) {
            logger.debug({permission: req.permission, user: user, statusCode: 403, message: 'access denied: user not found'});
            res.send(403, 'access denied (1)')
            return next();
          }
        
          value = JSON.parse(value);

          // If the account is disabled, do not let it do anything at all
          if (value.disabled == true || value.disabled == "true") {
            logger.debug({message: "account is disabled", user: value.username});
            res.send(401, {message: "access denied (2)"})
            return next();
          }

          // Check that passwords match
          if (value.password == sha1pwd) {
            // TODO: Better handling for non repo images urls
            if (req.url == '/v1/users/') {
              return next();
            }

            var repo = req.params.namespace + '/' + req.params.repo;

            req.username = user;
            req.namespace = req.params.namespace;
            req.repo = repo;

            // Check for repo permissions
            req.permission = value.permissions[req.namespace] || value.permissions[req.repo] || 'none';

            if (req.permission == "none") {
              logger.debug({req: req, permission: req.permission, statusCode: 403, message: 'access denied: permission not set'});
              res.send(403, 'access denied');
              return next();
            }

            if (req.method == 'GET' && req.permission != "read" && req.permission != "admin") {
              logger.debug({req: req, permission: req.permission, statusCode: 403, message: 'access denied: GET requested'});
              res.send(403, "access denied");
              return next();
            }
      
            if (req.method == "PUT" && req.permission != "write" && req.permission != "admin") {
              logger.debug({req: req, permission: req.permission, statusCode: 403, message: 'access denied: PUT requested'});
              res.send(403, "access denied");
              return next();
            }
      
            if (req.method == "DELETE" && req.permission != "delete" && req.permission != "admin") {
              logger.debug({req: req, permission: req.permission, statusCode: 403, message: 'access denied: DELETE requested'});
              res.send(403, "access denied");
              return next();
            }

            var access = "none";
            switch (req.method) {
              case "GET":
                access = "read";
                break;
              case "PUT":
                access = "write";
                break;
              case "DELETE":
                access = "delete";
                break;
            }

            req.authed = true;

            index_helpers.generateToken(repo, access, function(err, token) {
              var repo = req.params.namespace + '/' + req.params.repo;

              req.token_auth = {token: token, repo: repo, access: access};

              var token = 'signature=' + token + ', repository="' + repo + '", access=' + access;

              logger.debug({namespace: req.params.namespace, repo: req.params.repo, token: token, access: access});

              res.setHeader('WWW-Authenticate', 'Token ' + token);
              res.setHeader('X-Docker-Token', token)
              res.setHeader('X-Docker-Endpoints', config.registries);

              return next();          
            })
          }
          else {
            logger.debug({statusCode: 401, message: 'access denied: valid authorization information is required'});
            res.send(401, 'Authorization required');
            return next();
          }
        });
      }
      else if (auth[0] == 'Token') {
        var rePattern = new RegExp(/(\w+)[:=][\s"]?([^",]+)"?/g);
        var matches = req.headers.authorization.match(rePattern);

        var sig    = matches[0].split('=')[1];
        var repo   = matches[1].split('=')[1].replace(/\"/g, '');
        var access = matches[2].split('=')[1];

        req.token_auth = { token: sig, repo: repo, access: access };

        redis.get("tokens:" + sig, function(err, value) {
          if (err) {
            logger.error({err: err, token: sig});
            res.send(500, err);
            return next();
          }

          value = JSON.parse(value);
      
          if (value.repo == repo && value.access == access) {
            return next();
          }
          else {
            res.send(401, 'Authorization required');
            return next();
          }
        });
      }
    },

  }; // end return
}; // end module.exports
