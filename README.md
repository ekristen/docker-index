[![Build Status](https://travis-ci.org/ekristen/docker-index.png)](https://travis-ci.org/ekristen/docker-index)

# Overview

The purpose of this project is to provide the docker masses with an authenticated docker index for their own docker registry that has real repository access controls instead of just using htaccess on a reverse proxy.

While I don't have any problems using this software, I cannot say that it is 100% without bug or will work with anyone, I know some people have downloaded the project, but I haven received zero feedback as to functionality.

Known to work with registry version 0.7.x and 0.8.x

This is a functioning Docker Index that can be run independent of the Docker Registry software.

# Features

- Access Controls Per Namespace or Repo
- Webhooks (For New Images and All Image Pushes)
  - Can be disabled
  - History is kept, but can be disabled
- Internal API to Facilitate Management of the Index
- Command Line Tool to simplify the management of the Index
- Account Registration by just doing a docker login (can be disabled)
  - New accounts can also be disabled by default

# Installation

Check out the [Installation Document](README.install.md)

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



