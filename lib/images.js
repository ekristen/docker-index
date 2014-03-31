module.exports = function(redis, logger) {

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

        res.send(200, JSON.parse(value) || {});
        return next();
      });
    },

    repoImagesPut: function (req, res, next) {
      if (!req.params.namespace)
        req.params.namespace = 'library';

      res.send(204);
      return next();
    }
    
  } // end return

}