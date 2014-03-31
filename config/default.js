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
    '192.168.1.100:5000'
  ],
  users: [
  {
    username: 'testing',
    password: 'dc724af18fbdd4e59189f5fe768a5f8311527050',
    email: 'testing@testing.com',
    permissions: {
      'testing': 'admin'
    }
  }
  ]
}