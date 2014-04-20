module.exports = function(redis, logger) {

  return {
    
    repoGet: function (req, res, next) {
      if (!req.params.namespace)
        req.params.namespace = 'library';

      if (req.permission != 'admin' && req.permission != 'write') {
        res.send(403, 'access denied');
        return next();
      }

      redis.get('images:' + req.params.namespace + '_' + req.params.repo, function(err, value) {
        if (err) {
          logger.error({err: err, namespace: req.params.namespace, repo: req.params.repo});
          res.send(500, err);
          return next();
        }

        var images = [];

        if (value == null)
          var value = []
        else
          var value = JSON.parse(value);
    
        for (var i = 0; i<value.length; i++) {
          var found = false;
          for (var j = 0; j<images.length; j++) {
            if (images[j].id == value[i].id) {
              found = true;
            }
          }
    
          if (found === false)
            images.push(value[i])
        }

        for (var i = 0; i<req.body.length; i++) {
          var found = false;
          for (var j = 0; j<images.length; j++) {
            if (images[j].id == req.body[i].id) {
              found = true;
            }
          }
    
          if (found === false)
            images.push(req.body[i])
        }
    
        redis.set('images:' + req.params.namespace + '_' + req.params.repo, JSON.stringify(images), function(err, status) {
          if (err) {
            logger.error({err: err, type: 'redis', namespace: req.params.namespace, repo: req.params.repo});
            res.send(500, err);
            return next();
          }

          res.send(200, "")
          return next();
        })
      });
    },
    
    repoDelete: function (req, res, next) {
      if (!req.params.namespace)
        req.params.namespace = 'library';

      if (req.permission != 'admin')
        return res.send(403, 'access denied');
    }
    
    
  } 
}