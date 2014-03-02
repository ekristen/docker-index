This is Alpha software.

This is a functioning Docker Index that can be run independent of the Docker Registry software.

## Requirements 

1. Docker Registry
2. Redis

## How to Configure

1. Duplicate config/default.js to config/production.js 
2. Edit config/production.js
  * Edit Redis Host and Port Information
  * Edit Registries entry
    * Format: host [, host, host, host]
3. Make sure NODE_ENV is set to production
4. node app.js

## How to use HTTPS

You can modify the app.js to use HTTPS, or you can put this behind nginx or some other reverse proxy that support HTTPS.

## How to add Users

Did you remember that is just alpha software? :) 

Line 28 adds a user each time the app starts, or rather overwrites the user:testing value, you can edit it, the format is pretty simple.

user: testing
pass: testing

```
{
  email: 'testing@testing.com',
  password: 'SHA1-HASH',
  permissions: {
    'namespace': '(admin|write|read)',
    'namespace/repository': '(admin|write|read)'
  }
}
```

There are plans to change this eventually. Again Alpha Software.

## Todo

1. Create Admin Portal
2. Add SSL Support