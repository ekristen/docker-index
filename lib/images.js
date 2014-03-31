module.exports = function(redis) {

  return {

    repoImagesGet: function (req, res, next) { 
      if (!req.params.namespace)
        req.params.namespace = 'library';  

      redis.get("images:" + req.params.namespace + '_' + req.params.repo, function(err, value) {
        if (err) {
          res.send(500, err);
          return next();
        }

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