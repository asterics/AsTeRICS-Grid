import $ from 'jquery';
import superlogin from 'superlogin-client';
import {localStorageService} from "./data/localStorageService";
import {encryptionService} from "./data/encryptionService";
import {constants} from "../util/constants";
import {databaseService} from "./data/databaseService";
import {Router} from "../router";
import {dataService} from "./data/dataService";

let loginService = {};
let _loginInfo = null;
let _loggedInUser = null;
let _tryUser = null;
let _autoRetryHandler;
let _lastParamUser = null;
let _loginInProgress = false;

let _lastParamHashedPw = null;
let _lastParamSaveUser = null;
let _serverUrl = constants.IS_ENVIRONMENT_PROD ? 'https://couchdb.asterics-foundation.org:3001' : 'http://' + location.hostname + ':3000';
loginService.ERROR_CODE_UNAUTHORIZED = 'ERROR_CODE_UNAUTHORIZED';

loginService.ERROR_CODE_LOCKED = 'ERROR_CODE_LOCKED';
loginService.ERROR_CODE_NETWORK_ERROR = 'ERROR_CODE_NETWORK_ERROR';
superlogin.configure(getConfig());

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
    return _loginInfo.userDBs[keys[0]];
};

/**
 * logs in into remote couchdb (superlogin) and initializes local user database
 * @param plainPassword plain user password as typed in in password field
 *
 * @see loginService.loginHashedPassword() for other details.
 */
loginService.loginPlainPassword = function (user, plainPassword, saveUser) {
    _tryUser = user;
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
    _tryUser = user;
    return loginHashedPasswordInternal(user, hashedPassword, saveUser);
};

/**
 * logs in a user that is stored in HTML5 local storage
 * @param user the username to log in
 * @param dontRoute skip routing to main after successful login
 * @return {Promise<never>|Promise<unknown>|Promise<void>}
 */
loginService.loginStoredUser = function (user, dontRoute) {
    if (!user) {
        return Promise.resolve();
    }
    if (_loginInProgress) {
        log.warn('login currently in progress - aborting...');
        return Promise.reject();
    }
    _tryUser = user;
    _loginInProgress = true;
    let savedOnlineUsers = localStorageService.getSavedOnlineUsers();
    let savedLocalUsers = localStorageService.getSavedLocalUsers();
    let promise = new Promise((resolve, reject) => {
        if (loginService.getLoggedInUsername() === user) {
            return resolve();
        } else {
            loginService.logout();
        }

        if (savedOnlineUsers.includes(user) && localStorageService.isDatabaseSynced(user)) {
            let password = localStorageService.getUserPassword(user);
            databaseService.initForUser(user, password).then(() => {
                loginService.loginHashedPassword(user, password, true);
                resolve();
            });
        } else if (savedOnlineUsers.includes(user)) {
            log.info("waiting for successful login because user wasn't completely synced before...");
            let password = localStorageService.getUserPassword(user);
            loginService.loginHashedPassword(user, password, true).then(() => {
                resolve();
            }).catch((reason) => {
                reject(reason);
            });
        } else if (savedLocalUsers.includes(user)) {
            localStorageService.setAutologinUser(user);
            databaseService.initForUser(user, user).then(() => {
                resolve();
            });
        }
    });
    promise.then(() => {
        if (!dontRoute) {
            Router.toMain();
        }
    });
    promise.finally(() => {
        _loginInProgress = false;
    });
    return promise;
};

/**
 * logs out a logged in user from remote superlogin
 */
loginService.logout = function () {
    loginService.stopAutoRetryLogin();
    if (!_loggedInUser) {
        return;
    }
    log.debug('logging out user: ' + _loggedInUser);
    databaseService.closeCurrentDatabase();
    superlogin.logout(_loggedInUser);
    _loggedInUser = null;
    _loginInfo = null;
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
    _tryUser = user;
    loginService.stopAutoRetryLogin();
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
    }).then(() => {
        return dataService.importDefaultGridset();
    }).catch(reason => {
        log.info('registration failed!');
        log.info(reason);
        return Promise.reject(reason);
    });
};

/**
 * locally registers/creates a new username by user/password
 * @param username
 * @param hashedUserPassword
 * @return {*}
 */
loginService.registerOffline = function(username, hashedUserPassword) {
    loginService.logout();
    localStorageService.saveLocalUser(username);
    localStorageService.setAutologinUser(username);
    return databaseService.registerForUser(username, hashedUserPassword).then(() => {
        return dataService.importDefaultGridset();
    });
};

/**
 * checks if a given username is valid, returns constants.VALIDATION_*
 * @param username
 * @return {Promise}
 */
loginService.validateUsername = function (username) {
    return new Promise((resolve, reject) => {
        if (!username || !constants.USERNAME_REGEX.test(username)) {
            resolve(constants.VALIDATION_ERROR_REGEX);
            return;
        }
        if (localStorageService.isSavedLocalUser(username) || username === constants.LOCAL_DEMO_USERNAME) {
            resolve(constants.VALIDATION_ERROR_EXISTING);
            return;
        }
        superlogin.validateUsername(username).then(() => {
            resolve(constants.VALIDATION_VALID);
        }, (reason) => {
            log.debug(reason);
            resolve(constants.VALIDATION_ERROR_EXISTING);
        });
    });
};

/**
 * stops auto-retry of login, if currently running
 */
loginService.stopAutoRetryLogin = function () {
    if (_autoRetryHandler) {
        window.clearInterval(_autoRetryHandler);
        _autoRetryHandler = null;
    }
};

function loginInternal(user, hashedPassword, saveUser) {
    if (_tryUser !== user) {
        return Promise.reject(); //call from autologin that is outdated
    }
    _lastParamUser = user;
    _lastParamHashedPw = hashedPassword;
    _lastParamSaveUser = saveUser;
    user = user.trim();
    return superlogin.login({
        username: user,
        password: hashedPassword
    }).then((info) => {
        log.info('login success!');
        loginService.stopAutoRetryLogin();
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

function loginHashedPasswordInternal (user, hashedPassword, saveUser) {
    return loginInternal(user, hashedPassword, saveUser).then(() => {
        return databaseService.initForUser(user, hashedPassword, loginService.getLoggedInUserDatabase(), !saveUser).then(() => {
            return Promise.resolve(true);
        });
    }, (reason) => {
        if (_tryUser !== user) {
            return Promise.reject(); //call from autologin that is outdated
        }
        log.info('online login failed!');
        log.debug(reason);
        if (localStorageService.isDatabaseSynced(user)) {
            log.info('using offline local database...');
            localStorageService.setLastActiveUser(user);
            localStorageService.setAutologinUser(saveUser ? user : '');
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
    loginService.stopAutoRetryLogin();
    _autoRetryHandler = window.setTimeout(function () {
        log.info("auto-retry for online login with user: " + user);
        loginHashedPasswordInternal(user, hashedPassword, saveUser);
    }, 10000);
}

function getConfig() {
    //see https://github.com/micky2be/superlogin-client
    return {
        // An optional URL to API server, by default a current window location is used.
        serverUrl: _serverUrl,
        // The base URL for the SuperLogin routes with leading and trailing slashes (defaults to '/auth')
        baseUrl: '/auth',
        // Specific endpoint for social authentication and social link popups (defaults to `${location.origin}${baseUrl}`)
        //socialUrl: 'http://' + location.hostname + ':3001/auth',
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

    $(document).on(constants.EVENT_DB_DATAMODEL_UPDATE, function () {
        loginService.logout();
        localStorageService.setAutologinUser('');
        Router.toLogin();
    });
}

init();

export {loginService};