[![Build Status](https://travis-ci.org/ekristen/docker-index.png)](https://travis-ci.org/ekristen/docker-index)

Docker is working on version 2 of the registry which will not longer need this project, however it will need a token authentication server (which I have one in the works). To that end I will be wrapping up this project. Bug fixes will still happen, Pull Requests will be welcome as well, so long as they aren't major changes. 

I will provide an updae with respect to the version 2 auth server as soon as I have it online and working.

# Overview

The purpose of this project is to provide the docker masses with an authenticated docker index for their own docker registry that has real repository access controls instead of just using htaccess on a reverse proxy.

Technically now called the Docker Hub (by Docker), this is an independently developed version using the [Docker Hub and Registry Spec](https://docs.docker.com/reference/api/hub_registry_spec/) and throw a tiny bit of reverse engineering. 

This is a functioning Docker Index (Docker Hub) that can be run independent of the Docker Registry software.

This project does not have a front-end UI for administration or for viewing of repositories and images, to be able to view this information you will have to use the [command line tool](https://github.com/ekristen/docker-index-cli) that was written to work with it. 

# Features

- Access Controls Per Namespace or Repo (read, write, admin)
- Webhooks (For New Images and All Image Pushes)
  - Can be disabled in the config
  - History is kept, but can be disabled in the config
- Internal API to Facilitate Management of the Index
- [Command Line Tool](https://github.com/ekristen/docker-index-cli) to simplify the management of the Index
- Account Registration by just doing a docker login (can be disabled in the config)
  - New accounts can also be disabled by default

# Installation

Check out the [Installation Document](README.install.md)

# Configuration

Check out the [Configuration Document](README.config.md)

# API Documentation

API Docs Coming Soon

# Management / CLI Tool

To facilitate working with the `docker-index` more easily, there is a command line tool available. https://github.com/ekristen/docker-index-cli

All management is done via the new command line tool over at https://github.com/ekristen/docker-index-cli

# Other Information

## Initial Admin Account

When you start the docker index application for the first time, a first run text will be displayed to standard out. This text will contain the randomly set password for the default `admin` account.

## Access Levels (Permissions)

There are three access levels (aka permissions) for a namespace and/or repo combination. They are `read`, `write`, `admin`.

* **read** is pretty self explanatory, gives the user full read access to the namespace and/or namespace repo combo.
* **write** gives a user write access only, this is useful for automation scripts that you want to only have access to upload to a repo.
* **admin** gives a user read, write, and delete (not implemented) access to a namespace and/or namespace/repo.


