let fs = require('fs');
let express = require('express');
let http = require('http');
let https = require('https');
let bodyParser = require('body-parser');
let logger = require('morgan');
let cors = require('cors');
let { CouchAuth } = require('@perfood/couch-auth');
let useSSL = process.argv.length > 2 && process.argv[2] === 'ssl';
let dotenvFlow = require('dotenv-flow');

dotenvFlow.config({
    silent: true
});

let app = express();
app.use(logger('dev'));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

let config = {
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
        userDB: process.env.CAUTH_USER_DB,
        couchAuthDB: process.env.CAUTH_COUCH_AUTH_DB
    },
    local: {
        sendConfirmEmail: false,
        requireEmailConfirm: false,
        usernameLogin: true,
        emailUsername: false
    },
    mailer: {
        fromEmail: process.env.MAILER_FROM_EMAIL,
        options: {
            host: process.env.MAILER_HOST,
            port: process.env.MAILER_PORT,
            secure: process.env.MAILER_SECURE,
            auth: {
                user: process.env.MAILER_USER,
                pass: process.env.MAILER_PASS
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

// Initialize CouchAuth
try {
    console.log("starting with this config:");
    console.log(JSON.stringify(config));
    let couchAuth = new CouchAuth(config);
    app.use('/auth', couchAuth.router);
} catch (err) {
    console.error('err');
    console.error(err);
}

if (useSSL) {
    let privateKey = fs.readFileSync(process.env.PATH_TO_KEY, 'utf8');
    let certificate = fs.readFileSync(process.env.PATH_TO_CERT, 'utf8');
    let credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(3001);
} else {
    http.createServer(app).listen(3000);
}
