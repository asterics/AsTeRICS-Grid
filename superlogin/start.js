var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
var SuperLogin = require('@sensu/superlogin');
var isProd = process.argv.length > 2 && process.argv[2] == 'prod';
var path = require('path');

var app = express();
var accessLogStream = null;
var privateKey  = null;
var certificate = null;
var credentials = null;
if (isProd) {
    accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
    app.use(logger('combined', {
        stream: accessLogStream,
        skip: (req, res) => req.url.indexOf('/validate-username/') > -1
    }));
    privateKey = fs.readFileSync('/opt/couchdb/letsencrypt/live/couchdb.asterics-foundation.org/privkey.pem', 'utf8');
    certificate = fs.readFileSync('/opt/couchdb/letsencrypt/live/couchdb.asterics-foundation.org/fullchain.pem', 'utf8');
    credentials = {key: privateKey, cert: certificate};
} else {
    app.use(logger('dev'));
}

app.use(cors());
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
    publicURL: 'https://couchdb.asterics-foundation.org:6984',
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
if (isProd) {
    https.createServer(credentials, app).listen(3001);
} else {
    http.createServer(app).listen(3000);
}
