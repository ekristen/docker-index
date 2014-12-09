
# Overview 

# Requirements 

1. Docker
2. Docker Registry
3. Redis (this stores image and user information, you should run redis in a persistent mode that will meet your needs)

# Installation

## Production

The best way to do this is to use docker all the way and to use host mounted volumes for configuration files OR build each app by checking out the code and changing the configuration files.

1. docker pull dockerfile/redis
2. docker pull registry:0.9.0
3. docker pull ekristen/docker-index:1.4.0-rc1
4. Create folders for the docker registry and index config files.
  * mkdir /data/redis
  * mkdir /data/registry
  * mkdir /data/index
5. Start redis
    ```
    docker run -d --name="index_redis" \
      -v /data/redis:/data \
      dockerfile/redis
    ```
6. Start the registry
  * You should review the config_sample.yml and pick your settings_flavor and set the environment variables you need.
    ```
    docker run -d --name="registry" \
      -e SETTINGS_FLAVOR=local \
      -e STANDALONE=false \
      -p 5000:5000 \
      -v /tmp/registry:/data/registry \
      registry:0.9.0
    ```
7. Start the index
    ```
    docker run -d --name="docker_index" \
      -p 5100:5100 \
      -e REGISTRIES=registry.private.io \
      --link redis:redis \
      ekristen/docker-index:1.4.0-rc1
    ```

I'd suggest that you front both the index and the registry using nginx and SSL/TLS and use port 443. You can take a look at [my docker-index-nginx image](https://github.com/ekristen/docker-index-nginx)


## Development or Testing

Use Fig! I've included a fig.yml file in this repository, which given a docker server you can deploy a working setup, however you will need to setup a few things first.

By default the `fig.yml` uses `index.private.io` and `registry.private.io` for its hostnames, if you want to use something different make sure to update the `fig.yml` file. Either way you'll have to setup some sort of local DNS to make it work properly.

If you setup the the DNS properly all you should have to do is `fig up` and everything else will take care of itself.

