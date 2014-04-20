var config = require('config');
var restify = require('restify');
var bunyan = require('bunyan');
var restify_endpoints = require('restify-endpoints');

var logger = bunyan.createLogger({
  name: 'docker-index',
  stream: process.stdout,
  level: config.loglevel
});

// Setup Redis Connection
var redis = require('redis').createClient(config.redis.port, config.redis.host);

// Setup Restify Endpoints
var endpoints = new restify_endpoints.EndpointManager({
  endpointpath: __dirname + '/endpoints',
  endpoint_args: [config, redis, logger]
});

// Create our Restify server
var server = restify.createServer({
  name: 'docker-index',
  version: '1.0.0'
});

// Basic Restify Middleware
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());

// Important so that application/json does not override
// parameters passed via the url.
server.use(restify.bodyParser({
  mapParams: false,
  overrideParams: false
}));

// Audit logging to stdout
server.on('after', restify.auditLogger({
  log: bunyan.createLogger({
    name: 'audit',
    stream: process.stdout
  })
}));

// Attach our endpoints
endpoints.attach(server);

// Listen
server.listen(config.app.port, function () {
  console.log('%s listening at %s', server.name, server.url);
});


// Check and see if the system needs to be initialized,
// if so create a unqiue token to authenticate against the server.
redis.smembers('users', function(err, members) {
  if (members.length == 0) {
    // We'll assume that the system hasn't been initialzed and generate
    // random token used for initial auth from the command line tool.
    
    require('crypto').randomBytes(24, function(ex, buf) {
      var token = buf.toString('hex');
      
      redis.set('_initial_auth_token', token, function(err, result) {
        redis.expire('_initial_auth_token', 1800, function(err, result) {
          console.log('----------------------------------------------------------------------')
          console.log()
          console.log(' First Time Initialization Detected');
          console.log()
          console.log(' You will need the following token to authenticate with the');
          console.log(' command line tool to add your first admin account, this token');
          console.log(' will expire after 30 minutes, if you do not create your account');
          console.log(' within that time, simply restart the server and a new token will');
          console.log(' be generated');
          console.log()
          console.log(' Token: ' + token);
          console.log()
          console.log('----------------------------------------------------------------------')
        });
      });
    });
  }
})

