module.exports = function(redis) {
  var endpoints = {
    name: 'Test',
    description: 'Test Endpoints',
    endpoints: [
      {
        name: 'Test',
        description: 'Test',
        method: 'GET',
        auth: false,
        path: '/example',
        version: '1.0.0',
        fn: function (req, res, next) {
          res.send({"status":"ok","message":"test"});
          return next();
        }
      }
    ]
  };

  return endpoints
}