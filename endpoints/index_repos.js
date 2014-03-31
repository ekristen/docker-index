
module.exports = function(redis, logger) {
  var index_helpers = require('../lib/helpers.js')(redis);
  var index_middleware = require('../lib/middleware.js')(redis, logger);
  var index_repos = require('../lib/repos.js')(redis, logger);

  var endpoints = {
    name: 'Index Repositories Endpoints',
    description: 'Endpoints for Repository Interaction',
    endpoints: [
      {
        name: 'putLibraryRepo',
        description: 'Get Library Repository',
        method: 'PUT',
        path: [
          '/v1/repositories/:repo',
          '/v1/repositories/:namespace/:repo'
        ],
        version: '1.0.0',
        fn: index_repos.repoGet,
        middleware: [ index_middleware.requireAuth ]
      },
      
      {
        name: 'deleteLibraryRepo',
        description: 'Delete a Repository',
        method: 'DELETE',
        path: [
          '/v1/repositories/:repo',
          '/v1/repositories/:namespace/:repo'
        ],
        version: '1.0.0',
        fn: index_repos.repoDelete,
        middleware: [ index_middleware.requireAuth ]
      },
      
      {
        name: 'authLibraryRepo',
        description: 'Authenticate access to a repository',
        method: 'PUT',
        path: [
          '/v1/repositories/:repo/auth',
          '/v1/repositories/:namespace/:repo/auth'
        ],
        version: '1.0.0',
        fn: function (req, res, next) {
          res.send(200);
          return next();
        },
        middleware: [ index_middleware.requireAuth ]
      }
    ]
  };

  return endpoints
}