
module.exports = function(config, redis, logger) {
  var index_defaults = require('index/defaults')(config, redis, logger);

  var endpoints = {
    name: 'Docker Index -- Default Routes',
    description: 'Default Routes needed for the Index to function',
    endpoints: [

      {
        name: 'Ping',
        description: 'Docker Index -- Root/Ping',
        method: 'GET',
        auth: false,
        path: [
          '/v1',
          '/v1/_ping'
        ],
        version: '1.0.0',
        fn: index_defaults.ping
      }

    ]
  };

  return endpoints;

};
