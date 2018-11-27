var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var SuperLogin = require('superlogin');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var config = {
  dbServer: {
    protocol: 'http://',
    host: 'localhost:5984',
    user: 'admin',
    password: 'admin',
    userDB: 'sl-users',
    couchAuthDB: '_users'
  },
  mailer: {
    fromEmail: 'noreply@asterics-foundation.org',
    options: {
      service: 'Custom',
        auth: {
          user: 'noreply@asterics-foundation.org',
          pass: '...'
        }
    }
  },
  userDBs: {
    defaultDBs: {
      private: ['aeg-data']
    }
  }
}

// Initialize SuperLogin
var superlogin = new SuperLogin(config);

// Mount SuperLogin's routes to our app
app.use('/auth', superlogin.router);
http.createServer(app).listen(app.get('port'));