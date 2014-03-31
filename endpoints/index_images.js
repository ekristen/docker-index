
module.exports = function(redis) {
  var index_helpers = require('../lib/helpers.js')(redis);
  var index_middleware = require('../lib/middleware.js')(redis);
  var index_images = require('../lib/images.js')(redis);

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