
module.exports = function(config, redis, logger) {
  var index_helpers = require('../index/helpers.js')(redis);
  var index_middleware = require('../index/middleware.js')(config, redis, logger);
  var index_images = require('../index/images.js')(redis, logger);

  var endpoints = {
    name: 'Index Repositories Endpoints',
    description: 'Endpoints for Repository Interaction',
    endpoints: [

      {
        name: 'getLibraryRepoImages',
        description: 'Get Library Repository Images',
        method: 'GET',
        path: [
          '/v1/repositories/:repo/images',
          '/v1/repositories/:namespace/:repo/images'
        ],
        version: '1.0.0',
        fn: index_images.repoImagesGet,
        middleware: [ index_middleware.requireAuth ]
      },
      
      {
        name: 'putLibraryRepoImages',
        description: 'Update Library Repository Images',
        method: 'PUT',
        path: [
          '/v1/repositories/:repo/images',
          '/v1/repositories/:namespace/:repo/images'
        ],
        version: '1.0.0',
        fn: index_images.repoImagesPut,
        middleware: [ index_middleware.requireAuth ]
      },
      
    ]
  };

  return endpoints
}