
module.exports = function(config, redis, logger) {
  var internal_middleware = require('../internal/middleware.js')(config, redis, logger);
  var internal_users = require('../internal/users.js')(redis, logger);

  var endpoints = {
    name: 'InternalUsers',
    description: 'Endpoints for User interaction',
    endpoints: [
      {
        name: 'Get Users',
        description: 'Get a list of users and their permissions',
        method: 'GET',
        path: '/users',
        version: '1.0.0',
        fn: internal_users.listUsers,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Add User',
        description: 'Add User',
        method: 'POST',
        path: '/users',
        version: '1.0.0',
        fn: internal_users.createUser,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Get User',
        description: 'Get a Single User Entry',
        method: 'GET',
        path: '/users/:username',
        version: '1.0.0',
        fn: internal_users.getUser,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Enable User',
        description: 'Enable a Single User',
        method: 'PUT',
        path: [
          '/users/:username/enable'
        ],
        version: '1.0.0',
        fn: internal_users.enableUser,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Disable User',
        description: 'Disable a Single User',
        method: 'PUT',
        path: [
          '/users/:username/disable'
        ],
        version: '1.0.0',
        fn: internal_users.disableUser,
        middleware: [
          internal_middleware.requireAuth
        ]
      },

      {
        name: 'Get Permissions',
        description: 'Get User Permissions',
        method: 'GET',
        path: '/users/:username/permissions',
        version: '1.0.0',
        fn: internal_users.getUserPermissions,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Add Permission',
        description: 'Add Permission to User',
        method: 'PUT',
        path: '/users/:username/permissions',
        version: '1.0.0',
        fn: internal_users.addUserPermission,
        middleware: [
          internal_middleware.requireAuth
        ]
      },
      
      {
        name: 'Remove Permission',
        description: 'Remove Permission from User',
        method: 'DEL',
        path: '/users/:username/permissions/:repo',
        version: '1.0.0',
        fn: internal_users.removeUserPermission,
        middleware: [
          internal_middleware.requireAuth
        ]
      }

    ]
  };

  return endpoints;
}
