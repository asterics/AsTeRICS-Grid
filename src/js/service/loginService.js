import $ from 'jquery';
import superlogin from 'superlogin-client';
import {localStorageService} from "./data/localStorageService";
import {encryptionService} from "./data/encryptionService";
import {constants} from "../util/constants";
import {databaseService} from "./data/databaseService";

let loginService = {};
superlogin.configure(getConfig());
let _loginInfo = null;
let _loggedInUser = null;
let _autoRetryHandler;

let _lastParamUser = null;
let _lastParamHashedPw = null;
let _lastParamSaveUser = null;

loginService.ERROR_CODE_UNAUTHORIZED = 'ERROR_CODE_UNAUTHORIZED';
loginService.ERROR_CODE_LOCKED = 'ERROR_CODE_LOCKED';
loginService.ERROR_CODE_NETWORK_ERROR = 'ERROR_CODE_NETWORK_ERROR';

/**
 * returns currently logged in user, null of not logged in
 * @return {*}
 */
loginService.getLoggedInUsername = function () {
    return _loggedInUser;
};

/**
 * returns remote database address of currently logged in user, null if not logged in
 * @return {*}
 */
loginService.getLoggedInUserDatabase = function () {
    if (!_loginInfo || !_loginInfo.userDBs) {
        return null;
    }
    let keys = Object.keys(_loginInfo.userDBs);
    return _loginInfo.userDBs[keys[0]].replace('localhost:5984', location.hostname + ':5984');
};

/**
 * logs in into remote couchdb (superlogin) and initializes local user database
 * @param plainPassword plain user password as typed in in password field
 *
 * @see loginService.loginHashedPassword() for other details.
 */
loginService.loginPlainPassword = function (user, plainPassword, saveUser) {
    let hashedPassword = encryptionService.getUserPasswordHash(plainPassword);
    return loginService.loginHashedPassword(user, hashedPassword, saveUser);
};

/**
 * logs in into remote couchdb (superlogin) and initializes local user database
 * @param user
 * @param hashedPassword
 * @param saveUser if true, the user and password is saved to local storage
 * @return {Promise} resolves with value
 *              true ... if user successfully logged in online and local database successfully initialized.
 *              false ... if online login failed, but database is locally synced and initialization of offline database was successful
 *         Promise rejects with loginService.ERROR_CODE_* if online login failed and database is not locally synced.
 */
loginService.loginHashedPassword = function (user, hashedPassword, saveUser) {
    return loginInternal(user, hashedPassword, saveUser).then(() => {
        return databaseService.initForUser(user, hashedPassword, loginService.getLoggedInUserDatabase(), !saveUser).then(() => {
            return Promise.resolve(true);
        });
    }, (reason) => {
        log.info('online login failed!');
        log.debug(reason);
        if (localStorageService.isDatabaseSynced(user)) {
            log.info('using offline local database...');
            localStorageService.setLastActiveUser(user);
            localStorageService.setAutologinUser(saveUser ? user: '');
            if (reasonToErrorCode(reason) !== loginService.ERROR_CODE_UNAUTHORIZED) {
                autoRetryLogin(user, hashedPassword, saveUser);
            }
            return databaseService.initForUser(user, hashedPassword).then(() => {
                return Promise.resolve(false);
            });
        } else {
            return Promise.reject(reasonToErrorCode(reason));
        }
    });
};

/**
 * logs out, deletes all locally saved login data

 * @return {Promise}
 */
loginService.logout = function () {
    //TODO: use?!
    if (!_loggedInUser) {
        return Promise.reject();
    }
    log.warn('!here!!!!');
    //stopAutoRetryLogin();
    //return superlogin.logoutUser(_loggedInUser, session_id);

};

/**
 * registers with remote couchdb (superlogin), and logs in after successful registration.
 * Does not initialize local database, so use databaseService.initForUser() after successful registration.
 *
 * @param user username as chosen by user
 * @param plainPassword plain password as typed in by user
 * @param saveUser if true, the user and password is saved to local storage and database is synchronized locally,
 *        otherwise a registration with one-time login is performed, where only the online database is used
 * @return {Promise} resolves if online registration, login and (optional) initialization of local database successful.
 *          Promise rejects if registration, login or (optional) initialization of database failed.
 *
 */
loginService.register = function (user, plainPassword, saveUser) {
    stopAutoRetryLogin();
    user = user.trim();
    let password = encryptionService.getUserPasswordHash(plainPassword);
    log.debug("password hash: " + password);
    return superlogin.register({
        username: user,
        email: new Date().getTime() + '.' + Math.random() + '@norealmail.org',
        password: password,
        confirmPassword: password
    }).then((info) => {
        return loginInternal(user, password, saveUser)
    }).then(() => {
        log.info('registration successful!');
        return databaseService.registerForUser(_loggedInUser, password, loginService.getLoggedInUserDatabase(), !saveUser);
    }).catch(reason => {
        log.info('registration failed!');
        log.info(reason);
        return Promise.reject(reason);
    });
};

/**
 * checks if a given username is valid
 * @param username
 * @return {Promise}
 */
loginService.isValidUsername = function (username) {
    return new Promise((resolve, reject) => {
        if (!username || username === constants.LOCAL_NOLOGIN_USERNAME) {
            //TODO add regex
            // couchdb: ^[a-z][a-z0-9_$()+/-]*$
            // intended: ^[a-z][a-z0-9_+-]*$
            resolve(false);
            return;
        }
        superlogin.validateUsername(username).then(() => {
            resolve(true);
        }, (reason) => {
            log.debug(reason);
            resolve(false);
        });
    });
};

loginService.isLoggedInOnline = function () {
    return _loginInfo !== null;
};

function loginInternal(user, hashedPassword, saveUser) {
    _lastParamUser = user;
    _lastParamHashedPw = hashedPassword;
    _lastParamSaveUser = saveUser;
    user = user.trim();
    return superlogin.login({
        username: user,
        password: hashedPassword
    }).then((info) => {
        log.info('login success!');
        stopAutoRetryLogin();
        _loginInfo = info;
        _loggedInUser = user;
        localStorageService.setLastActiveUser(user);
        localStorageService.setAutologinUser(saveUser ? user: '');
        if (saveUser) {
            localStorageService.saveUserPassword(user, hashedPassword);
        }
        return Promise.resolve();
    });
}

function reasonToErrorCode(reason) {
    if (reason && reason.error && reason.error.toLowerCase() === 'unauthorized' && reason.message && reason.message.includes('locked')) {
        return loginService.ERROR_CODE_UNAUTHORIZED;
    }
    if (reason && reason.error && reason.error.toLowerCase() === 'unauthorized') {
        return loginService.ERROR_CODE_UNAUTHORIZED;
    }
    if (reason && reason.message && reason.message.toLowerCase() === 'network error') {
        return loginService.ERROR_CODE_NETWORK_ERROR;
    }
}

function autoRetryLogin(user, hashedPassword, saveUser) {
    stopAutoRetryLogin();
    _autoRetryHandler = window.setTimeout(function () {
        log.info("auto-retry for online login with user: " + user);
        loginService.loginHashedPassword(user, hashedPassword, saveUser);
    }, 10000);
}

function stopAutoRetryLogin() {
    if (_autoRetryHandler) {
        window.clearInterval(_autoRetryHandler);
        _autoRetryHandler = null;
    }
}

function getConfig() {
    //see https://github.com/micky2be/superlogin-client
    return {
        // An optional URL to API server, by default a current window location is used.
        serverUrl: 'http://' + location.hostname + ':3000',
        // The base URL for the SuperLogin routes with leading and trailing slashes (defaults to '/auth')
        baseUrl: '/auth',
        // Specific endpoint for social authentication and social link popups (defaults to `${location.origin}${baseUrl}`)
        socialUrl: 'http://' + location.hostname + ':3001/auth',
        // A list of API endpoints to automatically add the Authorization header to
        // By default the host the browser is pointed to will be added automatically
        //endpoints: ['api.example.com'],
        // Set this to true if you do not want the URL bar host automatically added to the list
        noDefaultEndpoint: false,
        // Where to save your session token: localStorage ('local') or sessionStorage ('session'), default: 'local'
        storage: 'local',
        // The authentication providers that are supported by your SuperLogin host
        //providers: ['facebook', 'twitter'],
        // Sets when to check if the session is expired during the setup.
        // false by default.
        checkExpired: false,
        // A float that determines the percentage of a session duration, after which SuperLogin will automatically refresh the
        // token. For example if a token was issued at 1pm and expires at 2pm, and the threshold is 0.5, the token will
        // automatically refresh after 1:30pm. When authenticated, the token expiration is automatically checked on every
        // request. You can do this manually by calling superlogin.checkRefresh(). Default: 0.5
        refreshThreshold: 0.5,
        // The number of milliseconds before a request times out
        // If the request takes longer than `timeout`, the request will be aborted.
        // Default is 0, meaning it won't timeout.
        timeout: 0
    };
}

function init() {
    $(document).on(constants.EVENT_DB_CONNECTION_LOST, function(e){
        log.info('connection lost! auto-retrying login after 10 seconds...');
        if(_lastParamUser && _lastParamHashedPw) {
            autoRetryLogin(_lastParamUser, _lastParamHashedPw, _lastParamSaveUser);
        }
    });
}

init();

export {loginService};