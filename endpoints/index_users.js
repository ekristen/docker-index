
module.exports = function(redis) {
  var index_helpers = require('../lib/helpers.js')(redis);
  var index_middleware = require('../lib/middleware.js')(redis);
  var index_users = require('../lib/users.js')(redis);

  var endpoints = {
    name: 'Users',
    description: 'Endpoints for User interaction',
    endpoints: [
      {
        name: 'Get Users',
        description: 'Get a list of users and their permissions',
        method: 'GET',
        auth: false,
        path: '/v1/users',
        version: '1.0.0',
        fn: function (req, res, next) {
          res.send(200);
          return next();
        },
        middleware: [
          index_middleware.requireAuth
        ]
      },
      
      {
        name: 'Index -- Create / Login User',
        description: 'Endpoint from Index Spec, to login or create user',
        method: 'POST',
        path: '/v1/users',
        fn: index_users.createUser,
        middleware: [
          index_middleware.requireAuth
        ]
      },
      
      {
        name: 'Index -- Update User',
        description: 'Endpoint from Index Spec, to update user',
        method: 'PUT',
        path: '/v1/users/:username',
        fn: index_users.updateUser,
        middleware: [
          index_middleware.requireAuth
        ]
      }
    ]
  };

  return endpoints
}