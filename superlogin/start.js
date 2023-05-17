let fs = require('fs');
let express = require('express');
let http = require('http');
let https = require('https');
let bodyParser = require('body-parser');
let logger = require('morgan');
let cors = require('cors');
let { CouchAuth } = require('@perfood/couch-auth');
let useSSL = false;
let dotenvFlow = require('dotenv-flow');
let infoTreeAPI = require('./infoTreeAPI/infoTreeAPI.js');

const USERNAME_REGEX = /^[A-Za-z0-9_-]{2,50}$/; // also see src/js/util/constants.js:8

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
        publicURL: process.env.DB_SERVER_PUBLIC_URL || 'http://127.0.0.1:5984',
        protocol: process.env.DB_SERVER_PROTOCOL || 'http://',
        host: process.env.DB_SERVER_HOST || '127.0.0.1:5984',
        user: process.env.DB_SERVER_USER || 'admin',
        password: process.env.DB_SERVER_PASSWORD || 'admin',
        userDB: process.env.CAUTH_USER_DB || 'auth-users',
        couchAuthDB: process.env.CAUTH_COUCH_AUTH_DB || '_users'
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

const nano = require('nano')(`${config.dbServer.protocol}${config.dbServer.user}:${config.dbServer.password}@${config.dbServer.host}`);
const authUsers = nano.use('auth-users');

// Initialize CouchAuth
try {
    logConfig();
    let couchAuth = new CouchAuth(config);
    app.use('/auth', couchAuth.router);
} catch (err) {
    console.error('err');
    console.error(err);
}

app.use('/user/validate-username/:name', async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    let name = req.params.name;
    if (!USERNAME_REGEX.test(name)) {
        console.log("regex not matching");
        res.status(200).json(false);
        next();
        return;
    }
    let result = await authUsers.view('views', 'view-usernames', { key: name });
    let valid = result && result.rows && result.rows.length === 0;
    res.status(200).json(valid);
    next();
});

app.use('/api/infotree', infoTreeAPI.getRouter(config.dbServer.protocol, config.dbServer.host));

if (useSSL) {
    let privateKey = fs.readFileSync(process.env.PATH_TO_KEY, 'utf8');
    let certificate = fs.readFileSync(process.env.PATH_TO_CERT, 'utf8');
    let credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(3001);
} else {
    http.createServer(app).listen(3000);
}

function logConfig() {
    console.log("starting with this config:");
    let logConfig = JSON.parse(JSON.stringify(config));
    logConfig.dbServer.password = '***';
    console.log(JSON.stringify(logConfig));
}
