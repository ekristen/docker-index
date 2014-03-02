module.exports = {
  app: {
    port: 5100
  },
  redis: {
    port: 6379,
    host: 'localhost'
  },
  loglevel: 'debug',
  registries: [
    // format: hostname [, hostname, hostname, hostname]
    '192.168.1.114:5000'
  ],
}