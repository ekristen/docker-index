var pkg = require('../package.json');

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
