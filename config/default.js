var pkg = require('../package.json');

module.exports = {
  version: pkg.version,
  loglevel: 'debug',
  app: {
    port: 5100
  },
  redis: {
    port: 6379,
    host: 'localhost'
  },
  registries: [
    // format: hostname [, hostname, hostname, hostname]
    'localhost:5000'
  ],
  webhooks: {
    disabled: false, // Globally disable the use of webhooks
    timeout: 3000,   // Time in milliseconds to wait for a successful webhook
    history: 30,     // Number of history records to keep per webhook (0 or false to disable)
  },
  disable_account_registration: false,
  disable_new_accounts: true
}
