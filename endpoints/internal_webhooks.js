
module.exports = function(config, redis, logger) {
  var internal_middleware = require('../internal/middleware.js')(config, redis, logger);
  var internal_webhooks = require('../internal/webhooks.js')(config, redis, logger);

  var endpoints = {
    name: 'InternalWebhooks',
    description: 'Endpoints for Webhook Interaction',
    endpoints: [
      {
        name: 'Get Webhooks',
        description: 'Get a list of all webhooks',
        method: 'GET',
        path: [
          '/webhooks/:repo',
          '/webhooks/:namespace/:repo'
        ],
        version: '1.0.0',
        fn: internal_webhooks.listWebhooks,
        middleware: [
          internal_middleware.requireAuth,
          internal_middleware.requireRepoAccess
        ]
      },
      {
        name: 'Create Webhook',
        description: 'Create a new webhook',
        method: 'POST',
        path: [
          '/webhooks/:repo',
          '/webhooks/:namespace/:repo'
        ],
        version: '1.0.0',
        fn: internal_webhooks.addWebhook,
        middleware: [
          internal_middleware.requireAuth,
          internal_middleware.requireRepoAccess
        ]
      },
      {
        name: 'Remove Webhook',
        description: 'Delete an existing webhook',
        method: 'DELETE',
        path: [
          '/webhooks/:repo',
          '/webhooks/:namespace/:repo'
        ],
        version: '1.0.0',
        fn: internal_webhooks.removeWebhook,
        middleware: [
          internal_middleware.requireAuth,
          internal_middleware.requireRepoAccess
        ]
      },
    ]
  };
  
  return endpoints;

};
