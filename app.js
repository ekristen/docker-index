var config = require('config');
var restify = require('restify');
var bunyan = require('bunyan');
var bunyan_format = require('bunyan-format');
var restify_endpoints = require('restify-endpoints');
var datastore = require('./app/datastore/index.js')({path: './db'});

// Setup logger
var logger = bunyan.createLogger({
  name: 'docker-index',
  stream: bunyan_format({outputMode: 'short'}),
  level: config.loglevel,
  src: true,
  serializers: {
    req: bunyan.stdSerializers.req
  }
});

// Setup Restify Endpoints
var endpoints = new restify_endpoints.EndpointManager({
  endpointpath: __dirname + '/endpoints',
  endpoint_args: [config, datastore, logger]
});

// Create our Restify server
var server = restify.createServer({
  name: 'docker-index',
  version: '1.0.0'
});

// Catch unhandled exceptions and log it!
server.on('uncaughtException', function (req, res, route, err) {
  console.log(err.stack);
  process.exit(1)
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

// Audit logging to stdout via bunyan
server.on('after', restify.auditLogger({
  log: logger
}));

server.get('/keys', function(req, res, next) {
  var all_keys = [];
  datastore.createKeyStream()
  .on('data', function(data) { all_keys.push(data); })
  .on('end', function() {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': JSON.stringify(all_keys, 0, 4).replace('\n', '<br>').length
    });
    res.write(JSON.stringify(all_keys, 0, 4).replace('\n', '<br>'));
    res.end();
  })
})
server.get('/keys/tokens', function(req, res, next) {
  var all_keys = [];
  datastore.createKeyStream({
    gte: datastore.key('tokens'),
    lte: datastore.key('tokens') + '\xFF'
  })
  .on('data', function(data) { all_keys.push(data); })
  .on('end', function() {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': JSON.stringify(all_keys, 0, 4).replace('\n', '<br>').length
    });
    res.write(JSON.stringify(all_keys, 0, 4).replace('\n', '<br>'));
    res.end();
  })
})
server.get('/keys/tokens/clear', function(req, res, next) {
  datastore.createKeyStream({
    gte: datastore.key('tokens'),
    lte: datastore.key('tokens') + '\xFF'
  }).on('data', function(key) { datastore.del(key) });
  res.send(200, 'OK');
})
server.get('/keys/clear', function(req, res, next) {
  datastore.createKeyStream().on('data', function(key) { datastore.del(key) });
  res.send(200, 'OK');
})
server.get('/keys/:key', function(req, res, next) {
  var key = datastore.key.call(datastore, req.params.key.split('_'))
  datastore.get(key, function(err, value) {
    return res.send(200, {key: key, value: value});
  });
});

// Attach our endpoints
endpoints.attach(server);

// Listen
server.listen(config.app.port, function () {
  console.log('%s listening at %s', server.name, server.url);
});

require('./lib/firsttime.js')(config, datastore);
//require('./lib/upgrades.js')(config, redis);

//datastore.hooks.post(function (ch) { console.log(ch); });
