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
