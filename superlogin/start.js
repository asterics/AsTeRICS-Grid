var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var SuperLogin = require('@sensu/superlogin');

var app = express();
app.set('port', process.env.PORT || 3000);
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var config = {
    testMode: {
        // Use a stub transport so no email is actually sent
        noEmail: true,
        // Displays debug information in the oauth dialogs
        oauthDebug: false,
        // Logs out-going emails to the console
        debugEmail: true
    },
    dbServer: {
    protocol: 'http://',
    host: 'localhost:5984',
    user: 'admin',
    password: 'admin',
    userDB: 'sl-users',
    couchAuthDB: '_users'
  },
  local: {
    sendConfirmEmail: false,
    requireEmailConfirm: false,
  },
  mailer: {
    fromEmail: 'noreply@asterics-foundation.org',
    options: {
		host: 'smtp.1und1.de',
        port: 587,
        secure: false,
        auth: {
            user: 'noreply@asterics-foundation.org',
            pass: '...'
        }
    }
  },
  emails: {
    confirmEmail: {
      subject: 'Please confirm your email'
    },
    forgotPassword: {
      subject: 'Your password reset link'
    }
  },
  userDBs: {
    defaultDBs: {
      private: ['asterics-grid-data']
    }
  }
};

// Initialize SuperLogin
var superlogin = new SuperLogin(config);

// Mount SuperLogin's routes to our app
app.use('/auth', superlogin.router);
http.createServer(app).listen(app.get('port'));