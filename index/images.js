var util = require('util');

module.exports = function(config, redis, logger) {

  return {

    repoImagesGet: function (req, res, next) { 
      if (!req.params.namespace)
        req.params.namespace = 'library';  

      redis.get("images:" + req.params.namespace + '_' + req.params.repo, function(err, value) {
        if (err) {
          logger.error({err: err, function: "repoImagesGet"});
          res.send(500, err);
          return next();
        }

        logger.debug({namespace: req.params.namespace, repo: req.params.repo});

        redis.keys(util.format("tokens:%s:images:*", req.token_auth.token), function(err, keys) {
          if (keys.length == 1) {
            redis.del(keys, function(err, success) {
              if (err) {
                logger.error({err: err, function: "repoImagesGet"});
                res.send(500, err);
                return next();
              }
              
              redis.expire(util.format("tokens:%s", req.token_auth.token), 60, function(err, success2) {
                if (err) {
                  logger.error({err: err, function: "repoImagesGet"});
                  res.send(500, err);
                  return next();
                }

                res.send(200, JSON.parse(value) || {});
                return next();
              })
            })
          }
          else {
            res.send(200, JSON.parse(value) || {});
            return next();
          }
        })
      });
    },

    repoImagesPut: function (req, res, next) {
      if (!req.params.namespace)
        req.params.namespace = 'library';

      var name = req.params.namespace + '_' + req.params.repo;

      redis.sismember('images', name, function(err, status) {
        if (err) {
          logger.error({err: err, function: "repoImagesPut:sismember"});
          res.send(500, err);
          return next();
        }

        if (status == 0) {
          redis.sadd('images', name, function(err) {
            if (err) {
              logger.error({err: err, function: "repoImagesPut:sadd"});
              res.send(500, err);
              return next();
            }

            res.send(204);
            return next();
          });
        }
        else {
          res.send(204);
          return next();
        }
      })
    },
    
    repoImagesLayerAccess: function (req, res, next) {
      var key = util.format("tokens:%s:images:%s", req.token_auth.token, req.params.image);
      redis.get(key, function(err, result) {
        if (err) {
          res.send(500, {error: err, access: false})
          return next();
        }

        redis.del(key);

        if (result == "1") {
          res.send(200, {access: true})
          return next();
        }
        else {
          res.send(200, {access: false})
          return next();
        }
      });
    }
    
  } // end return

}
