
module.exports = function(config, redis, logger) {

  var endpoints = {
    name: 'Docker Index -- Default Routes',
    description: 'Default Routes needed for the Index to function',
    endpoints: [

      {
        name: 'Root',
        description: 'Docker Index Root Endpoint',
        method: 'GET',
        auth: false,
        path: '/v1',
        version: '1.0.0',
        fn: function(req, res, next) {
          // TODO: pass through to the actual registry??
    	    res.setHeader('X-Docker-Registry-Version', '0.8.0');
    	    res.setHeader('X-Docker-Registry-Standalone', 'false');
    	    res.send(200);
          next();
        }
      },

      {
        name: 'Ping',
        description: 'Docker Index -- Ping',
        method: 'GET',
        auth: false,
        path: '/v1/_ping',
        version: '1.0.0',
        fn: function(req, res, next) {
          // TODO: pass through to the actual registry??
    	    res.setHeader('X-Docker-Registry-Version', '0.8.0');
    	    res.setHeader('X-Docker-Registry-Standalone', 'false');
    	    res.send(200);
          next();
        }
      }

    ]
  };

  return endpoints
}
