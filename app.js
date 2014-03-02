/**
 * Module dependencies.
 */

var express = require('express');
var config = require('config');
var http = require('http');
var path = require('path');
var crypto = require('crypto');
var fs = require('fs');
var winston = require('winston');
var redisStore = require('connect-redis')(express);

var redis = require('redis').createClient(config.redis.port, config.redis.host);

var logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({timestamp: true}),
  ]
});

var loggingStream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};

redis.set("user:testing", JSON.stringify({password: "dc724af18fbdd4e59189f5fe768a5f8311527050", permissions: { "testing": "admin" }}));

var app = express();

// all environments
app.set('port', config.app.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger({stream:loggingStream, format: 'short'}));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
  secret: 'abc123',
  maxAge: Date.now() + 7200000,
  store: new redisStore({client: redis})
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// generate authorization token
function generateToken(repo, access, cb) {
  var shasum = crypto.createHash('sha1');
  shasum.update(Math.random().toString(36));
  shasum.update(Math.random().toString(36));
  shasum.update(Math.random().toString(36));
  
  var sha1 = shasum.digest('hex');

  logger.debug('token: ' + sha1);

  redis.set("token:" + sha1, JSON.stringify({repo: repo, access: access}), function(err, status) {
    //redis.expire("token:" + sha1, 30, function(err, status) {
      cb(sha1);
    //});
  });
}

function requireAuth(req, res, next) {
  if (!req.headers.authorization)
    return res.send(401, 'authorization required');

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
      if (err)
        return res.send(500, err);

      if (value == null)
        return res.send(403, 'access denied')
        
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
          return res.send(403, 'access denied');
        }

        if (req.method == 'GET' && req.permission != "read" && req.permission != "write" && req.permission != "admin") {
          return res.send(403, "access denied");
        }
      
        if (req.method == "PUT" && req.permission != "write" && req.permission != "admin") {
          return res.send(403, "access denied");
        }
      
        if (req.method == "DELETE" && req.permission != "delete" && req.permission != "admin") {
          return res.send(403, "access denied");
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

        generateToken(repo, access, function(token) {
          var repo = req.params.namespace + '/' + req.params.repo;
          var token = 'signature=' + token + ', repository="' + repo + '", access=' + access;
          logger.debug('token: ' + token);
          res.setHeader('WWW-Authenticate', 'Token ' + token);
          res.setHeader('X-Docker-Token', token)
          res.setHeader('X-Docker-Endpoints', config.registries);

          return next();          
        })
      }
      else {
        res.send(401, 'Authorization required');
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
      if (err)
        return res.send(500, err);

      value = JSON.parse(value);
      
      logger.debug('token: ' + value);

      redis.del("token:" + sig, function (err) {
        if (err) {
          return res.send(500, err);
        }

        if (value.repo == repo && value.access == access) {
          return next();
        }
        else {
            res.send(401, 'Authorization required');
        }
      });
      
    });
  }
}

function ok(req, res, next) {
  res.send(200);
}

function createUser(req, res, next) {
  redis.get("user:" + req.body.username, function(err, value) {
    if (err) {
      return res.send(500, err);
    }

    var user = value || {};

    var shasum = crypto.createHash("sha1");
    shasum.update(req.body.password);
    var sha1 = shasum.digest("hex");

    user.password = sha1;
    user.email = req.body.email;

    redis.set("user:" + req.body.username, JSON.stringify(user), function(err, status) {
      if (err) {
        return res.send(500, err);
      }

      res.send(201);
    });
  });
}

function updateUser(req, res, next) {
  redis.get("user:" + req.params.username, function(err, value) {
    if (err) {
      return res.send(500, err);
    }

    var user = value || {};

    var shasum = crypto.createHash("sha1");
    shasum.update(req.body.password);
    var sha1 = shasum.digest("hex");

    user.password = sha1;
    user.email = req.body.email;

    redis.set("_user_" + req.params.username, JSON.stringify(user), function(err, status) {
      if (err) {
        return res.send(500, err);
      }
    
      res.send(204);
    });
  });
}

function repoImagesPut(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  logger.debug('repoImagesPut called');
  logger.debug('repoImagesPut - namespace: ' + req.params.namespace + ', repo: ' + req.params.repo);

  res.send(204);
}

function repoImagesGet(req, res, next) { 
  if (!req.params.namespace)
    req.params.namespace = 'library';  

  redis.get("images:" + req.params.namespace + '_' + req.params.repo, function(err, value) {
    if (err) {
      return res.send(500, err);
    }

    res.send(200, value || {});
  });
}

function repoGet(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  if (req.permission != 'admin' && req.permission != 'write') {
    return res.send(403, 'access denied');
  }

  redis.get('images:' + req.params.namespace + '_' + req.params.repo, function(err, value) {
    if (err) {
      return res.send(500, err);
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
        return res.send(500, err);
      }

      res.send(200, "")
    })
  });
}

function repoDelete(req, res, next) {
  if (!req.params.namespace)
    req.params.namespace = 'library';

  if (req.permission != 'admin')
    return res.send(403, 'access denied');
    
}

// User Repo
app.put('/v1/repositories/:namespace/:repo', requireAuth, repoGet);
app.del('/v1/repositories/:namespace/:repo', requireAuth, repoDelete);

// Library Repo
app.put('/v1/repositories/:repo', requireAuth, repoGet);
app.del('/v1/repositories/:repo', requireAuth, repoDelete);

// User Repo Images
app.put('/v1/repositories/:namespace/:repo/images', requireAuth, repoImagesPut);
app.get('/v1/repositories/:namespace/:repo/images', requireAuth, repoImagesGet);

// Library Repo Images
app.put('/v1/repositories/:repo/images', requireAuth, repoImagesPut);
app.get('/v1/repositories/:repo/images', requireAuth, repoImagesGet);

// Library Repo Auth
app.put('/v1/repositories/:repo/auth', requireAuth, ok);

// User Repo Auth
app.put('/v1/repositories/:namespace/:repo/auth', requireAuth, ok);

// Users
app.get('/v1/users', requireAuth, ok);
app.post('/v1/users', createUser);
app.put('/v1/users/:username', requireAuth, updateUser);

// Search
app.get('/v1/search', function(req, res, next) {
  res.send(404);
});

// Ping
app.get('/v1/_ping', function(req, res, next) {
  res.setHeader('X-Docker-Registry-Version', '0.6.5');
  res.send(200);
});

// Listen
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
