var crypto = require('crypto');

module.exports = function(config, redis, logger) {
  var index_helpers = require('./helpers.js')(redis);

  return {
    requireAuth: function (req, res, next) {
      if (!req.headers.authorization) {
        res.send(401, 'authorization required');
        return next();
      }

      if (!req.params.namespace)
        req.params.namespace = 'library';

      var auth = req.headers.authorization.split(' ');

      if (auth[0] == 'Basic') {
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
            // TODO: Better handling for non repo images urls
            if (req.url == '/v1/users/') {
              return next();
            }

            var repo = req.params.namespace + '/' + req.params.repo;

            req.username = user;
            req.namespace = req.params.namespace;
            req.repo = repo;

            // Check for repo permissions
            req.permission = value.permissions[repo] || 'none';
            // Check for namespace permissions
            req.permission = value.permissions[req.params.namespace] || 'none';

            if (req.permission == "none") {
              res.send(403, 'access denied');
              return next();
            }

            if (req.method == 'GET' && req.permission != "read" && req.permission != "write" && req.permission != "admin") {
              res.send(403, "access denied");
              return next();
            }
      
            if (req.method == "PUT" && req.permission != "write" && req.permission != "admin") {
              res.send(403, "access denied");
              return next();
            }
      
            if (req.method == "DELETE" && req.permission != "delete" && req.permission != "admin") {
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

            index_helpers.generateToken(repo, access, function(err, token) {
              var repo = req.params.namespace + '/' + req.params.repo;
              var token = 'signature=' + token + ', repository="' + repo + '", access=' + access;

              logger.debug({namespace: req.params.namespace, repo: req.params.repo, token: token, access: access});

              res.setHeader('WWW-Authenticate', 'Token ' + token);
              res.setHeader('X-Docker-Token', token)
              res.setHeader('X-Docker-Endpoints', config.registries);

              return next();          
            })
          }
          else {
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

        redis.get("token:" + sig, function(err, value) {
          if (err) {
            logger.error({err: err, token: sig});
            res.send(500, err);
            return next();
          }

          value = JSON.parse(value);
      
          redis.del("token:" + sig, function (err) {
            if (err) {
              logger.error({err: err, token: sig});
              res.send(500, err);
              return next();
            }

            if (value.repo == repo && value.access == access) {
              return next();
            }
            else {
              res.send(401, 'Authorization required');
              return next();
            }
          });
      
        });
      }
    }
  }
}
