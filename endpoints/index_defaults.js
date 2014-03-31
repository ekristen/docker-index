
module.exports = function(redis) {

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
    	    res.setHeader('X-Docker-Registry-Version', '0.6.5');
    	    res.send(200);
          return next();
        }
      },

      {
        name: 'Ping',
        description: 'Docker Index -- Ping',
        method: 'GET',
        auth: false,
        path: '/v1/ping',
        version: '1.0.0',
        fn: function(req, res, next) {
    	    res.setHeader('X-Docker-Registry-Version', '0.6.5');
    	    res.send(200);
          return next();
        }
      }

    ]
  };

  return endpoints
}