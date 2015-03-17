// TODO: implement

module.exports = function(config, redis, logger) {

  var endpoints = {
    name: 'Index Search',
    description: 'Search Endpoint for the Docker Index',
    endpoints: [

      {
        name: 'Search',
        description: 'Search the Docker Index',
        method: 'GET',
        auth: false,
        path: '/v1/search',
        version: '1.0.0',
        fn: function(req, res, next) {
          res.send(501);
          return next();
        }
      },

    ]
  };

  return endpoints
}