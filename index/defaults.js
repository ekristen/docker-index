var util = require('util');
var request = require('request');

module.exports = function(config, redis, logger) {

  var endpoints = {};

  endpoints.ping = function(req, res, next) {
    if (typeof(config.test) != "undefined" && config.test == true) {
      res.setHeader('X-Docker-Registry-Standalone', 'false');
      res.send(200);
      return next();
    }
    else {
      var url = util.format("%s://%s/v1/_ping", config.registry.protocol, config.registries[0]);
      console.log(url);
      request.get(url, function(err, response, body) {
        next.ifError(err);

        if (typeof(response.headers['x-docker-registry-standalone']) == "undefined") {
          logger.error('Unable to find required headers when connecting to the registry', response.headers);
          return next('Unable to find required headers when connecting to the registry');
        }

        logger.debug(util.format('X-Docker-Registry-Standalone: %s', response.headers['x-docker-registry-standalone']));

        res.setHeader('X-Docker-Registry-Standalone', response.headers['x-docker-registry-standalone']);
        res.send(200);
        return next();
      }); 
    }

  };

  return endpoints;

};
