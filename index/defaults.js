var util = require('util');
var request = require('request');

module.exports = function(config, redis, logger) {

  var endpoints = {};

  endpoints.ping = function(req, res, next) {
    // TODO: pass through to the actual registry??
    if (typeof(config.test) != "undefined" && config.test == true) {
      res.setHeader('X-Docker-Registry-Version', '0.8.0');
      res.setHeader('X-Docker-Registry-Standalone', 'false');
      res.send(200);
      return next();
    }
    else {
      var url = util.format("%s://%s/v1/_ping", config.registry.protocol, config.registries[0]);
      console.log(url);
      request.get(url, function(err, response, body) {
        next.ifError(err);

        if (typeof(response.headers['x-docker-registry-version']) == "undefined" || 
            typeof(response.headers['x-docker-registry-standalone']) == "undefined") {
          logger.error('Unable to find required headers when connecting to the registry', response.headers);
          return next('Unable to find required headers when connecting to the registry');
        }

        logger.debug(util.format('X-Docker-Registry-Version: %s', response.headers['x-docker-registry-version']));
        logger.debug(util.format('X-Docker-Registry-Standalone: %s', response.headers['x-docker-registry-standalone']));
        logger.debug(util.format('X-Docker-Registry-Config: %s', response.headers['x-docker-registry-config']));

        res.setHeader('X-Docker-Registry-Version', response.headers['x-docker-registry-version']);
        res.setHeader('X-Docker-Registry-Standalone', response.headers['x-docker-registry-standalone']);
        res.setHeader('X-Docker-Registry-Config', response.headers['x-docker-registry-config'] || 'unknown');

        res.send(200);
        return next();
      }); 
    }

  };

  return endpoints;

};
