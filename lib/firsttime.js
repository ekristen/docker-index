module.exports = function(config, redis) {
  
  var user_count = 0;

  redis.createKeyStream({
    gte: redis.key('users'),
    lte: redis.key('users') + '\xFF'
  })
    .on('data', function(key) {
      ++user_count;
    })
    .on('end', function() {

      // We'll assume that the system hasn't been initialzed and generate
      // random token used for initial auth from the command line tool.
      if (user_count == 0) {
        require('crypto').randomBytes(12, function(ex, buf) {
          var token = buf.toString('hex');
          token = '42331dcbd3d11ac49ce8aaae';

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

          redis.set(redis.key('users', 'admin'), userObj, function(err, result) {
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
      }
      
    });
  
};
