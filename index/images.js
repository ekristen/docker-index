var util = require('util');

module.exports = function(config, redis, logger) {

  return {

    repoImagesGet: function (req, res, next) { 
      if (!req.params.namespace)
        req.params.namespace = 'library';

      redis.get(redis.key('images', req.params.namespace, req.params.repo), function(err, images) {
        if (err && err.status != '404') {
          logger.error({err: err, function: "repoImagesGet"});
          res.send(500, err);
          return next();
        }
        
        if (err && err.status == '404') {
          images = {};
        }

        logger.debug({namespace: req.params.namespace, repo: req.params.repo});

        var key_count = 0;

        redis.createKeyStream({
          gte: redis.key('tokens', req.token_auth.token, 'images'),
          lte: redis.key('tokens', req.token_auth.token, 'images') + '\xFF'
        })
        .on('error', function(err) {
          logger.error({err: err});
          res.send(500, err);
          return next();
        })
        .on('data', function(key) {
          console.log(key)
          ++key_count;
        })
        .on('end', function() {
          if (key_count == 1) {
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

                res.send(200, images);
                return next();
              })
            })
          }
          else {
            res.send(200, images);
            return next();
          }
        });
      });
    },

    repoImagesPut: function (req, res, next) {
      if (!req.params.namespace)
        req.params.namespace = 'library';

      redis.set(redis.key('images', req.params.namespace, req.params.repo), {}, function(err, success) {
        if (err) {
          logger.error({err: err, function: "repoImagesPut:sismember"});
          res.send(500, err);
          return next();
        }
  
        res.send(204);
        return next();
      });
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
