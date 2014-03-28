/**
 * Module dependencies.
 */

var express = require('express');
var config = require('config');
var http = require('http');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var restify = require('restify');
var bunyan = require('bunyan');
var restify_endpoints = require('restify-endpoints');

var redis = require('redis').createClient(config.redis.port, config.redis.host);

var helpers = require('./lib/helpers')(redis);
var users = require('./lib/users')(redis);

var endpoints = new restify_endpoints.EndpointManager({
  endpointpath: __dirname + '/endpoints',
  endpoint_args: [
    redis
  ]
  
});

var logger = {
  debug: function(msg) {
    console.log(msg)
  }
};

// Update Users 
require('./updateusers.js');

var server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser({
  mapParams: false,
  overrideParams: false
}));

server.on('after', restify.auditLogger({
  log: bunyan.createLogger({
    name: 'audit',
    stream: process.stdout
  })
}));


function requireBasicAuth(req, res, next) {
  if (!req.headers.authorization) {
    res.send(401, 'authorization required');
    return next();
  }

  if (!req.params.namespace)
    req.params.namespace = 'library';

  var auth = req.headers.authorization.split(' ');
  
  console.log(auth);
  return next();
}

function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    res.send(401, 'authorization required');
    return next();
  }

  if (!req.params.namespace)
    req.params.namespace = 'library';

  var auth = req.headers.authorization.split(' ');

  if (auth[0] == 'Basic') {
    var buff  = new Buffer(auth[1], 'base64');
    var plain = buff.toString();
    var creds = plain.split(':');
    var user  = creds[0];
    var pass  = creds[1];

    var shasum = crypto.createHash('sha1');
    shasum.update(pass);
    var sha1pwd = shasum.digest('hex');

    redis.get("user:" + user, function(err, value) {
      if (err) {
        res.send(500, err);
        return next();
      }

      if (value == null) {
        res.send(403, 'access denied')
        return next();
      }
        
      value = JSON.parse(value);

      if (value.password == sha1pwd) {
        var repo = req.params.namespace + '/' + req.params.repo;

        req.username = user;
        req.namespace = req.params.namespace;
        req.repo = repo;

        // Check for repo permissions
        req.permission = value.permissions[repo] || 'none';
        // Check for namespace permissions
        req.permission = value.permissions[req.params.namespace] || 'none';

        if (req.permission == "none") {
          res.send(403, 'access denied');
          return next();
        }

        if (req.method == 'GET' && req.permission != "read" && req.permission != "write" && req.permission != "admin") {
          res.send(403, "access denied");
          return next();
        }
      
        if (req.method == "PUT" && req.permission != "write" && req.permission != "admin") {
          res.send(403, "access denied");
          return next();
        }
      
        if (req.method == "DELETE" && req.permission != "delete" && req.permission != "admin") {
          res.send(403, "access denied");
          return next();
        }

        var access = "none";
        switch (req.method) {
          case "GET":
            access = "read";
            break;
          case "PUT":
            access = "write";
            break;
          case "DELETE":
            access = "delete";
            break;
        }

        helpers.generateToken(repo, access, function(err, token) {
          var repo = req.params.namespace + '/' + req.params.repo;
          var token = 'signature=' + token + ', repository="' + repo + '", access=' + access;

          res.setHeader('WWW-Authenticate', 'Token ' + token);
          res.setHeader('X-Docker-Token', token)
          res.setHeader('X-Docker-Endpoints', config.registries);

          return next();          
        })
      }
      else {
        res.send(401, 'Authorization required');
        return next();
      }
    });
  }
  else if (auth[0] == 'Token') {
    var rePattern = new RegExp(/(\w+)[:=][\s"]?([^",]+)"?/g);
    var matches = req.headers.authorization.match(rePattern);

    var sig    = matches[0].split('=')[1];
    var repo   = matches[1].split('=')[1].replace(/\"/g, '');
    var access = matches[2].split('=')[1];

    redis.get("token:" + sig, function(err, value) {
      if (err) {
        res.send(500, err);
        return next();
      }

      value = JSON.parse(value);
      
      logger.debug('token: ' + value);

      redis.del("token:" + sig, function (err) {
        if (err) {
          res.send(500, err);
          return next();
        }

        if (value.repo == repo && value.access == access) {
          return next();
        }
        else {
          res.send(401, 'Authorization required');
          return next();
        }
      });
      
    });
  }
}

function ok(req, res, next) {
  res.send(200);
  return next();
}

/*
function createUser(req, res, next) {
  redis.get("user:" + req.body.username, function(err, value) {
    if (err) {
      res.send(500, err);
      return next();
    }

    var user = JSON.parse(value) || {};

    // Check to make sure a user was found.
    if (user.length == 0) {
      res.send(403, "bad username and/or password (1)");
      return next();
    }

    var shasum = crypto.createHash("sha1");
    shasum.update(req.body.password);
    var sha1 = shasum.digest("hex");

    // Check to make sure the password is valid.
    if (user.password != sha1) {
      res.send(403, "bad username and/or password (2)");
      return next();
    }

    user.password = sha1;
    user.email = req.body.email;

    redis.set("user:" + req.body.username, JSON.stringify(user), function(err, status) {
      if (err) {
        res.send(500, err);
        return next();
      }

      res.send(201);
      return next();
    });
  });
}
*/

function updateUser(req, res, next) {
  redis.get("user:" + req.params.username, function(err, value) {
    if (err) {
      res.send(500, err);
      return next();
    }

    var user = JSON.parse(value) || {};

    var shasum = crypto.createHash("sha1");
    shasum.update(req.body.password);
    var sha1 = shasum.digest("hex");

    user.password = sha1;
    user.email = req.body.email;

    redis.set("_user_" + req.params.username, JSON.stringify(user), function(err, status) {
      if (err) {
        res.send(500, err);
        return next();
      }
    
      res.send(204);
      return next();
    });
  });
}

function repoImagesPut(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  logger.debug('repoImagesPut called');
  logger.debug('repoImagesPut - namespace: ' + req.params.namespace + ', repo: ' + req.params.repo);

  res.send(204);
  return next();
}

function repoImagesGet(req, res, next) { 
  if (!req.params.namespace)
    req.params.namespace = 'library';  

  redis.get("images:" + req.params.namespace + '_' + req.params.repo, function(err, value) {
    if (err) {
      res.send(500, err);
      return next();
    }

    res.send(200, JSON.parse(value) || {});
    return next();
  });
}

function repoGet(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  if (req.permission != 'admin' && req.permission != 'write') {
    res.send(403, 'access denied');
    return next();
  }

  redis.get('images:' + req.params.namespace + '_' + req.params.repo, function(err, value) {
    if (err) {
      res.send(500, err);
      return next();
    }

    var images = [];

    if (value == null)
      var value = []
    else
      var value = JSON.parse(value);
    
    for (var i = 0; i<value.length; i++) {
      var found = false;
      for (var j = 0; j<images.length; j++) {
        if (images[j].id == value[i].id) {
          found = true;
        }
      }
    
      if (found === false)
        images.push(value[i])
    }

    for (var i = 0; i<req.body.length; i++) {
      var found = false;
      for (var j = 0; j<images.length; j++) {
        if (images[j].id == req.body[i].id) {
          found = true;
        }
      }
    
      if (found === false)
        images.push(req.body[i])
    }
    
    redis.set('images:' + req.params.namespace + '_' + req.params.repo, JSON.stringify(images), function(err, status) {
      if (err) {
        res.send(500, err);
        return next();
      }

      res.send(200, "")
      return next();
    })
  });
}

function repoDelete(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  if (req.permission != 'admin')
    return res.send(403, 'access denied');
}

// Library Repo
server.put('/v1/repositories/:repo', requireAuth, repoGet);
server.del('/v1/repositories/:repo', requireAuth, repoDelete);

// Library Repo Images
server.put('/v1/repositories/:repo/images', requireAuth, repoImagesPut);
server.get('/v1/repositories/:repo/images', requireAuth, repoImagesGet);

// Library Repo Auth
server.put('/v1/repositories/:repo/auth', requireAuth, ok);

// User Repo
server.put('/v1/repositories/:namespace/:repo', requireAuth, repoGet);
server.del('/v1/repositories/:namespace/:repo', requireAuth, repoDelete);

// User Repo Images
server.put('/v1/repositories/:namespace/:repo/images', requireAuth, repoImagesPut);
server.get('/v1/repositories/:namespace/:repo/images', requireAuth, repoImagesGet);

// User Repo Auth
server.put('/v1/repositories/:namespace/:repo/auth', requireAuth, ok);

// Users
server.get('/v1/users', requireAuth, ok);
server.post('/v1/users', users.createUser);
server.put('/v1/users/:username', requireAuth, updateUser);

// Search
server.get('/v1/search', function(req, res, next) {
  res.send(501);
  next();
});

// Ping
server.get('/v1', function(req, res, next) {
	res.setHeader('X-Docker-Registry-Version', '0.6.5');
	res.send(200);
  next();
});
server.get('/v1/_ping', function(req, res, next) {
  res.setHeader('X-Docker-Registry-Version', '0.6.5');
  res.send(200);
  next();
});

endpoints.attach(server);

// Listen
server.listen(5100, function () {
  console.log('%s listening at %s', server.name, server.url);
});