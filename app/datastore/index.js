var level = require('level-hyper');
var ttl   = require('level-ttl');
var lkey  = require('level-key');
var hooks = require('level-hooks');

module.exports = datastore = function(opts) {
  var db = level(opts.path || "./db", { valueEncoding: 'json' });

  hooks(db);
  //db = lkey(db);

  ttl(db);
  db.methods = db.methods || {};
  db.methods.ttl = { type: 'async' };
  db.ttl = db.ttl;

  var close = db.close;
  db.close = function() {
    db.stop();
    close.apply(db,arguments);
  };

  db.set = db.put;
  db.expire = db.ttl;
  db.exists = function(key, callback) {
    db.get(key, function(err, result) {
      if (err && err.status !='404') {
        return callback(err);
      }
      else if (err && err.status == '404') {
        return callback(null, false);
      }
      else {
        return callback(null, true);
      }
    })
  };

  db.methods.key = { type: 'sync' };
  db.key = function() {

    var args = arguments[0];
    if (!Array.isArray(arguments[0])) {
      args = [].slice.call(arguments);
    }

    if (args.length < 1) {
      throw new Error('Not enough arguments');
    }
 
    if (args.length == 1) return '!' + arguments[0];
  
    var key = args.pop();
    return '!' + args.join(':') + ':' + key;
  }; 

  return db;  
};
