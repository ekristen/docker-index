module.exports = {
  app: {
    port: process.env.PORT || 5100
  },
  redis: {
    port: process.env.REDIS_PORT_6379_TCP_PORT || 6379,
    host: process.env.REDIS_PORT_6379_TCP_ADDR || 'localhost'
  },
  registries: process.env.REGISTRIES
}