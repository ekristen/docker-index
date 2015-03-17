
module.exports = function(redis, logger) {

  var endpoints = {};

  endpoints.listImages = function(req, res, next) {
    redis.smembers('images', function(err, members) {
      res.send(200, members);
      return next();
    });
  };

  return endpoints;

};