[![Build Status](https://travis-ci.org/ekristen/docker-index.png)](https://travis-ci.org/ekristen/docker-index)

This is Alpha software. If you want to help, let me know.

This is a functioning Docker Index that can be run independent of the Docker Registry software.

# Important
I just re-factored this entire application from Express.JS to Restify. I also implemented an endpoint manager (Restify Endpoints). Everything should be backwards compatible, but if you are running into issues please make sure to let me know and if you are looking for the original code, check out the v1.0 tag.

I'm in the process of writing unit tests, and better documentation. I'm also working on writing API endpoints to facilitate the creation and management of user accounts too, so check by.

The documentation below should still be accurate, but if you run into issues, please let me know.

## Requirements 

1. Docker
2. Redis (this stores image and user information, you should run redis in a persistent mode that will meet your needs)

## How to Use

The best way to do this is to use docker all the way and to use host mounted volumes for configuration files OR build each app by checking out the code and changing the configuration files.

1. git clone 
2. docker pull dockerfile/redis
3. docker pull registry
4. docker build -t docker_index .
5. Create folders for the docker registry and index config files.
  * mkdir /data/registry/config
  * mkdir /data/index/config
6. Grab a copy of the registry config file, and create a *prod* section and fill it out according to your needs and drop it in the folder you created for the registry using the filename *config.yml*. Make sure you set index_endpoint configuration option.
7. Copy docker.js and template.js from the index/config folder to the folder you setup for the index app config files, rename tempalte to local-docker.js. Configuration files stack by a certain order (you can see http://lorenwest.github.io/node-config/latest/). 
8. Edit local-docker.js to update users stanza.
9. docker run -d -name "index_redis" dockerfile/redis
10. docker run -d -name "docker_registry" -p 5000:5000 -e SETTINGS\_FLAVOR=prod -v /data/registry/config:/docker-registry/config
11. docker run -d -name "docker_index" -p 5100:5100 -e REGISTRIES=hostname.to.registry -link redis:index\_redis -v /data/index/config:/opt/app/config docker\_index

I'd suggest that you front both the index and the registry using nginx and SSL/TLS and use port 443.

## How to add Users

Did you remember that is just alpha software? :) 

Edit local-docker.js to add your users and permissions. 

`docker run docker_index updateusers.js`

This will update the users. This is a temporary measure. I really want to have a UI that allows you to manage accounts. 
