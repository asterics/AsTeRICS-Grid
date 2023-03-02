var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var logger = require('morgan');
var cors = require('cors');
// var SuperLogin = require('@sensu/superlogin');
var { CouchAuth: SuperLogin } = require('@perfood/couch-auth');
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
    privateKey = fs.readFileSync(process.env.PATH_TO_KEY, 'utf8');
    certificate = fs.readFileSync(process.env.PATH_TO_CERT, 'utf8');
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
    publicURL: process.env.DB_SERVER_PUBLIC_URL,
    protocol: process.env.DB_SERVER_PROTOCOL,
    host: process.env.DB_SERVER_HOST,
    user: process.env.DB_SERVER_USER,
    password: process.env.DB_SERVER_PASSWORD,
    userDB: process.env.DB_SERVER_USER_DB,
    couchAuthDB: process.env.DB_SERVER_COUCH_AUTH_DB,
  },
  local: {
    sendConfirmEmail: false,
    requireEmailConfirm: false,
    usernameLogin: true,
    emailUsername: false,
  },
  mailer: {
    fromEmail: process.env.MAILER_FROM_EMAIL,
    options: {
  		host: process.env.MAILER_HOST,
      port: process.env.MAILER_PORT,
      secure: process.env.MAILER_SECURE,
      auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
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
try {
  var superlogin = new SuperLogin(config);
} catch(err) {
  console.error('err');
  console.error(err);
}

// Mount SuperLogin's routes to our app
app.use('/auth', superlogin.router);
if (isProd) {
    https.createServer(credentials, app).listen(3001);
} else {
    http.createServer(app).listen(3000);
}
