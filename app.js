var config = require('config');
var restify = require('restify');
var bunyan = require('bunyan');
var restify_endpoints = require('restify-endpoints');

// Setup Redis Connection
var redis = require('redis').createClient(config.redis.port, config.redis.host);

// Setup Restify Endpoints
var endpoints = new restify_endpoints.EndpointManager({
  endpointpath: __dirname + '/endpoints',
  endpoint_args: [
    redis
  ]
});

// Create our Restify server
var server = restify.createServer({
  name: 'docker-index',
  version: '1.0.0'
});
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

// TODO: REMOVE!!! -- Update Users 
require('./updateusers.js');

// Listen
server.listen(5100, function () {
  console.log('%s listening at %s', server.name, server.url);
});