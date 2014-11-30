
module.exports = function(config, redis, logger) {
  var internal_middleware = require('../internal/middleware.js')(config, redis, logger);
  var internal_images = require('../internal/images.js')(redis, logger);

  var endpoints = {
    name: 'Internal API - Images in Index',
    description: 'Endpoints for Image interaction in the Index',
    endpoints: [

      {
        name: 'List Images',
        description: 'Retrieve a list of all images stored in the index',
        method: 'GET',
        path: '/images',
        version: '1.0.0',
        fn: internal_images.listImages,
        middleware: [
          internal_middleware.requireAuth,
          internal_middleware.requireAdmin
        ]
      }

    ]
  };
  
  return endpoints;
};
