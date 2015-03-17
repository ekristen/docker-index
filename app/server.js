var xtend = require('xtend')
var config = require('config')
var restify = require('restify')
var restify_endpoints = require('restify-endpoints')
var datastore = require('datastore')({path: './db'})

var DockerIndex = function(opts) {
  opts = xtend({
    logger: require('logger'),
    datastore: require('datastore')
  }, opts)

  // Setup Restify Endpoints
  var endpoints = new restify_endpoints.EndpointManager({
    endpointpath: __dirname + '/endpoints',
    endpoint_args: [config, datastore, opts.logger]
  })

  // Create our Restify server
  var server = restify.createServer({
    name: 'docker-index',
    version: '1.0.0'
  })

  // Catch unhandled exceptions and log it!
  server.on('uncaughtException', function (req, res, route, err) {
    opts.logger.error('uncaughtException', err)
    process.exit(1)
  })

  // Basic Restify Middleware
  server.use(restify.acceptParser(server.acceptable))
  server.use(restify.queryParser())

  // Important so that application/json does not override
  // parameters passed via the url.
  server.use(restify.bodyParser({
    mapParams: false,
    overrideParams: false
  }))

  // Audit logging to stdout via bunyan
  server.on('after', restify.auditLogger({
    log: opts.logger
  }))

  // Attach our endpoints
  endpoints.attach(server)

  // Listen
  server.listen(config.app.port, function () {
    opts.logger.info('%s listening at %s', server.name, server.url)
  })
  
  require('./lib/firsttime.js')(config, datastore)
  //require('./lib/upgrades.js')(config, redis)

  return server
}

module.exports.createServer = DockerIndex

