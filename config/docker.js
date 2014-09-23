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
  registries: process.env.REGISTRIES.split(',')
}