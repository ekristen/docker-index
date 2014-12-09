# Configuration

This uses `node-config` to handle all the configuration files. 

You should never modify the default.js file. If you are working on this locally, you should add a `local.js` to the config directory for local development and testing. If you are using docker, review the docker.js file for all the environment variables you can override.


## default.js

```
module.exports = {
  version: pkg.version,
  loglevel: 'debug',
  app: {
    port: 5100 // Port that the application listens on
  },
  redis: {
    port: 6379,
    host: 'localhost'
  },
  // Javascript array of valid registry endpoints.
  registries: [
    'localhost:5000'
  ],
  registry: {
    protocol: 'https' // If you are running a registry on HTTP you'll need to update this value, ideally in local.js
  },
  webhooks: {
    disabled: false, // Globally disable the use of webhooks
    timeout: 3000,   // Time in milliseconds to wait for a successful webhook
    history: 30,     // Number of history records to keep per webhook (0 or false to disable)
  },
  disable_account_registration: false,
  disable_new_accounts: true
}
```

## docker.js

When using the docker image, this file will be combined with `default.js`. These settings can be set via environment variables.

For a working version of this in action please see the [fig.yml](fig.yml) file.

```
module.exports = {
  app: {
    port: process.env.PORT || 5100
  },
  private: process.env.PRIVATE_MODE ? true : false,
  loglevel: process.env.LOG_LEVEL || 'error',
  redis: {
    port: process.env.REDIS_PORT_6379_TCP_PORT || 6379,
    host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost'
  },
  registries: process.env.REGISTRIES.split(','),
  registry: {
    protocol: process.env.REGISTRY_PROTOCOL || 'https'
  },
  webhooks: {
    disabled: process.env.WEBHOOKS_DISABLED || false, // Globally disable the use of webhooks
    timeout: process.env.WEBHOOKS_TIMEOUT || 3000,   // Time in milliseconds to wait for a successful webhook
    history: process.env.WEBHOOKS_HISTORY || 30,     // Number of history records to keep per webhook (0 or false to disable)
  },
  disable_account_registration: process.env.DISABLE_ACCOUNT_REGISTRATION || false,
  disable_new_accounts: process.env.DISABLE_NEW_ACCOUNTS || true,
}
```
