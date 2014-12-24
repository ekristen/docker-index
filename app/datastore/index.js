var level = require('level-hyper');
var ttl   = require('level-ttl');
var lkey  = require('level-key');

module.exports = datastore = function(opts) {

  var db = level(opts.path || "./db", { valueEncoding: 'json' });

  db = lkey(db);
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

  return db;  
};
