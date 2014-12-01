var crypto = require('crypto');
var util = require('util');
var async = require('async');
var request = require('request');

module.exports = function(config, redis, logger) {

  return {
    
    processWebhooks: function(req, res, route, err) {
      if (config.webhooks.disabled == true) {
        return next();
      }

      if (!req.params.namespace || !req.params.repo) {
        logger.debug({message: 'missing namespace or repo, unable to process webhooks'});
        return next();
      }

      async.series([
        // Get Webhooks
        function(callback) {
          var all_webhooks = [];
          var webhooks_key = util.format('webhooks:%s_%s', req.params.namespace, req.params.repo);
          redis.smembers(webhooks_key, function(err, hooks) {
            if (err) return callback(err);
            async.eachSeries(hooks, function(hook, hook_cb) {
              var hook_key = util.format('webhooks:%s_%s:%s', req.params.namespace, req.params.repo, hook);
              redis.hgetall(hook_key, function(err, hook_details) {
                if (err) return hook_cb(err);

                if (hook_details == null)
                  return hook_cb(null)

                all_webhooks.push(hook_details);

                hook_cb(null);
              })
            }, function(err) {
              if (err) return callback(err);

              callback(null, all_webhooks)
            })
          });
        },
        // Determine Event Type
        function(callback) {
          var images_key = util.format('images:%s_%s', req.params.namespace, req.params.repo);
          redis.get(images_key, function(err, images_json) {
            if (err) return callback(err);

            if (images_json == null)
              var images = []
            else
              var images = JSON.parse(images_json);

            var new_images = req.body;

            var existing_ids = [];
            for (var i=0; i<images.length; i++) {
              if (typeof(images[i].Tag) != "undefined")
                existing_ids.push(images[i].id);
            }

            var event = 'existing';

            var new_ids = [];
            var new_tags = [];
            for (var i=0; i<new_images.length; i++) {
              new_ids.push(new_images[i].id);
              if (typeof(new_images[i].Tag) != "undefined") {
                new_tags.push(new_images[i].Tag);
                if (existing_ids.indexOf(new_images[i].id) == -1) {
                  event = 'new';
                }
              }
            }
            
            callback(null, event, new_ids, new_tags);
          });
        }
      ], function(err, results) {
        // results[0] -- webhooks
        // results[1] -- event type
        if (err) logger.error({err: err, stack: err.stack});

        if (results[0].length == 0) {
          logger.debug({message: 'No Webhooks to Run', namespace: req.params.namespace, repository: req.params.repo});
          return;
        }

        var webhooks = results[0];
        var event = results[1][0];
        var images = results[1][1];
        var tags = results[1][2];
        
        webhooks.forEach(function(webhook) {
          if (typeof(webhook[event]) != "undefined" && webhook[event] == 'true') {
            var payload = {
              push_data: {
                pushed_at: Math.round(new Date() / 1000),
                images: images,
                tags: tags,
                pusher: req.username || 'unknown'
              },
              repository: {
                name: req.params.repo,
                namespace: req.params.namespace,
                repo_name: util.format('%s/%s', req.params.namespace, req.params.repo),
              }
            };

            var delivery = crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex');

            var headers = {
              'X-Docker-Index-Delivery': delivery,
              'X-Docker-Index-Event': event
            };

            var history_key = util.format('webhooks:%s_%s:%s:history', req.params.namespace, req.params.repo, webhook.id);

            request.post({
              url: webhook.url,
              timeout: config.webhooks.timeout,
              json: true,
              body: payload,
              headers: headers,
            }, function(err, res, body) {
              var history_payload = {
                created: Math.round(new Date() / 1000),
                request: {
                  headers: headers,
                  payload: payload
                },
                response: {
                  headers: res.headers,
                  statusCode: res.statusCode,
                  body: body
                }
              };

              if (err) {
                logger.error({err: err, stack: err.stack, domain: 'webhooks', fn: 'processWebhooks', namespace: req.params.namespace, repository: req.params.repo}, 'unable to send payload');
                history_payload.error = err;
              }

              if (!err && res.statusCode != 200) {
                logger.error({
                  domain: 'webhooks',
                  fn: 'processWebhooks',
                  statusCode: res.statusCode,
                  url: webhook.url,
                  namespace: req.params.namespace,
                  repository: req.params.repo
                }, 'webhook received bad status code');
              }

              if (config.webhooks.disabled == false && config.webhooks.history != false) {
                redis.lpush(history_key, JSON.stringify(history_payload));
              }

              if (!err && res.statusCode == 200) {
                logger.info({domain: 'webhooks', fn: 'processWebhooks', url: webhook.url, namespace: req.params.namespace, repository: req.params.repo}, 'webhook successful');
              }
            });
          }
        });
        
      });

    },
    
  };
  
};
