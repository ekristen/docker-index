
module.exports = function(config, redis, logger) {

  var endpoints = {
    name: 'Docker Index -- Internal Routes',
    description: 'Default Routes needed for the Index to function',
    endpoints: [

      {
        name: 'Ping',
        description: 'Docker Index -- Ping',
        method: 'GET',
        path: '/_ping',
        version: '1.0.0',
        fn: function(req, res, next) {
          res.setHeader('X-Docker-Index-Version', config.version);
          res.send(200);
          return next();
        }
      }

    ]
  };

  return endpoints;

};
