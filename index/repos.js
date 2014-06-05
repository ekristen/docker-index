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

        var images = {};

        if (value == null)
          var value = []
        else
          var value = JSON.parse(value);

        var data = value.concat(req.body);

        for (var x = 0; x<data.length; x++) {
          var i = data[x];
          var iid = i['id'];

          if (typeof(images[iid]) !== "undefined" && typeof(images[iid]['checksum']) !== "undefined")
            continue;

          i_data = {'id': iid};

          // check if checksum is set
          if (typeof(i['checksum']) !== "undefined") {
            i_data['checksum'] = i['checksum'];
          }

          // check if tag is set
          if (typeof(i['Tag']) !== "undefined") {
            i_data['Tag'] = i['Tag'];
          }

          images[iid] = i_data;
        }

        var final_images = [];
        for (var key in images) {
          final_images.push(images[key]);
        }
    
        redis.set('images:' + req.params.namespace + '_' + req.params.repo, JSON.stringify(final_images), function(err, status) {
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