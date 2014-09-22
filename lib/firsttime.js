module.exports = function(config, redis) {
  
  redis.smembers('users', function(err, members) {
    if (members.length == 0) {
      // We'll assume that the system hasn't been initialzed and generate
      // random token used for initial auth from the command line tool.

      require('crypto').randomBytes(12, function(ex, buf) {
        var token = buf.toString('hex');


        var shasum = require('crypto').createHash("sha1");
        shasum.update(token);
        var sha1 = shasum.digest("hex");

        var userObj = {
          username: 'admin',
          password: sha1,
          email: 'admin@localhost',
          disabled: false,
          admin: true,
          permissions: {
            test: "admin",
            admin: "admin",
            dockerfile: "admin"
          }
        };

        redis.set('users:admin', JSON.stringify(userObj), function(err, result) {
          redis.sadd('users', 'admin', function(err, result1) {
            console.log('----------------------------------------------------------------------')
            console.log()
            console.log(' First Time Initialization Detected');
            console.log()
            console.log(' Default username and password created')
            console.log()
            console.log(' User: ' + userObj.username);
            console.log(' Pass: ' + token);
            console.log()
            console.log(' You can push or pull by default to the namespace test/ and admin/')
            console.log(' You can login against the repo with these credentials and/or use')
            console.log('   the docker-index command line utility to change your password')
            console.log('   and further adminsiter the index (users, permissions, etc)')
            console.log()
            console.log('----------------------------------------------------------------------')
          
          });
        });
    
      });
    }
  });
  
};