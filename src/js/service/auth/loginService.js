import $ from '../../externals/jquery.js';
import { authClient } from './authClient.js';
import { localStorageService } from '../data/localStorageService';
import { encryptionService } from '../data/encryptionService';
import { constants } from '../../util/constants';
import { databaseService } from '../data/databaseService';
import { Router } from '../../router';
import { webradioService } from '../webradioService.js';
import { MainVue } from '../../vue/mainVue.js';
import {util} from "../../util/util.js";

let loginService = {};

let DELETE_USER_DEFAULT_PASSWORD = 'delete_my_user';
loginService.DELETE_SUCCESS = "DELETE_SUCCESS";
loginService.DELETE_FAILED_GENERAL = "DELETE_FAILED_GENERAL";
loginService.DELETE_FAILED_WRONG_PASSWORD = "DELETE_FAILED_WRONG_PASSWORD";

let _loginInfo = null;
let _loggedInUser = null;
let _tryUser = null;
let _autoRetryHandler;
let _retryCount = 0;
let _lastParamUser = null;
let _loginInProgress = false;

let _lastParamHashedPw = null;
let _lastParamSaveUser = null;

// Configure multi-node URLs based on environment
let _serverUrls = constants.DBS_SERVERS_DEV;
if (constants.IS_ENVIRONMENT_PROD || constants.FORCE_CONNECT_DB) {
    _serverUrls = constants.DBS_SERVERS_PROD;
}
if (constants.IS_ENVIRONMENT_BETA) {
    _serverUrls = constants.DBS_SERVERS_TEST;
}

authClient.setServerUrls(_serverUrls);

loginService.ERROR_CODE_UNAUTHORIZED = 'ERROR_CODE_UNAUTHORIZED';
loginService.ERROR_CODE_LOCKED = 'ERROR_CODE_LOCKED';
loginService.ERROR_CODE_NETWORK_ERROR = 'ERROR_CODE_NETWORK_ERROR';

/**
 * returns currently logged in user, null of not logged in
 * @return {*}
 */
loginService.getLoggedInUsername = function () {
    return _loggedInUser || databaseService.getCurrentUsedDatabase();
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
 * logs in into remote couchdb and initializes local user database
 * @param user
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
 * logs in into remote couchdb (couch-auth) and initializes local user database
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
            let password = localStorageService.getUserSettings(user).password;
            localStorageService.setAutologinUser(user);
            databaseService.initForUser(user, password).then(() => {
                loginService.loginHashedPassword(user, password, true);
                resolve();
            });
        } else if (savedOnlineUsers.includes(user)) {
            log.info("waiting for successful login because user wasn't completely synced before...");
            let password = localStorageService.getUserSettings(user).password;
            loginService
                .loginHashedPassword(user, password, true)
                .then(() => {
                    resolve();
                })
                .catch((reason) => {
                    log.warn("online login failed!", reason);
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
    log.debug('logging out user: ' + _loggedInUser);
    $(document).trigger(constants.EVENT_USER_CHANGING);
    loginService.stopAutoRetryLogin();
    webradioService.stop();
    MainVue.clearTooltip();
    databaseService.closeCurrentDatabase();

    if (_loggedInUser) {
        authClient.logout();
    }

    _loggedInUser = null;
    _loginInfo = null;
};

/**
 * registers with remote couchdb (couch-auth), and logs in after successful registration.
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
loginService.register = function (user, plainPassword, saveUser = true) {
    _tryUser = user;
    loginService.stopAutoRetryLogin();
    user = user.trim();
    let password = encryptionService.getUserPasswordHash(plainPassword);
    log.debug('password hash: ' + password);

    return authClient
        .register({
            username: user,
            email: new Date().getTime() + '.' + Math.random() + '@norealmail.org',
            password: password,
            confirmPassword: password
        })
        .then(async () => {
            await util.sleep(500);
            return loginInternal(user, password, saveUser);
        })
        .then(() => {
            log.info('registration successful!');
            return databaseService.registerForUser(
                _loggedInUser,
                password,
                loginService.getLoggedInUserDatabase(),
                !saveUser
            );
        })
        .catch((reason) => {
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
loginService.registerOffline = function (username, hashedUserPassword) {
    loginService.logout();
    localStorageService.saveUserPassword(username, '');
    localStorageService.setAutologinUser(username);
    return databaseService.registerForUser(username, hashedUserPassword);
};

/**
 * checks if a given username is valid, returns constants.VALIDATION_*
 * @param username
 * @return {Promise}
 */
loginService.validateUsername = function (username) {
    return new Promise((resolve) => {
        if (!username || !constants.USERNAME_REGEX.test(username)) {
            resolve(constants.VALIDATION_ERROR_REGEX);
            return;
        }
        if (localStorageService.isSavedLocalUser(username) || username === constants.LOCAL_DEMO_USERNAME) {
            resolve(constants.VALIDATION_ERROR_EXISTING);
            return;
        }

        // This request will naturally pick a random URL because there is no session yet
        authClient.request(`/user/validate-username/${username}`)
            .then(async (response) => {
                if (!response.ok) {
                    resolve(constants.VALIDATION_ERROR_EXISTING);
                    return;
                }
                let result = await response.json();
                // dbs-proxy returns { available: true/false }, couch-auth returns { ok: true }.
                let isAvailable = result.available !== undefined ? result.available : !!result.ok;
                resolve(isAvailable ? constants.VALIDATION_VALID : constants.VALIDATION_ERROR_EXISTING);
            })
            .catch((e) => {
                log.warn("couldn't check username");
                resolve(constants.VALIDATION_ERROR_FAILED);
            });
    });
};

/**
 * stops auto-retry of login, if currently running
 */
loginService.stopAutoRetryLogin = function () {
    if (_autoRetryHandler) {
        clearTimeout(_autoRetryHandler);
        _autoRetryHandler = null;
    }
};

/**
 * Deletes user account. AuthClient handles targeting the correct node automatically.
 */
loginService.deleteOnlineUser = async function(user = '', password) {
    let session = authClient.getSession();
    if (!session || user.toLowerCase() !== session.user_id) {
        log.warn("couldn't delete user - not logged in with the user to delete:", user);
        return loginService.DELETE_FAILED_GENERAL;
    }

    let hashedUserPassword = localStorageService.getUserSettings(user).password;
    if (password !== DELETE_USER_DEFAULT_PASSWORD && encryptionService.getUserPasswordHash(password) !== hashedUserPassword) {
        return loginService.DELETE_FAILED_WRONG_PASSWORD;
    }

    try {
        const response = await authClient.request('/proxy/request-deletion', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.token}:${session.password}`
            },
            body: JSON.stringify({
                username: session.user_id,
                password: hashedUserPassword
            })
        });

        if (!response.ok) {
            log.warn(`HTTP error! Status: ${response.status}`);
            return loginService.DELETE_FAILED_GENERAL;
        }

        const data = await response.json();
        return !!data.success ? loginService.DELETE_SUCCESS : loginService.DELETE_FAILED_GENERAL;
    } catch (error) {
        console.error('Error:', error);
    }
    return loginService.DELETE_FAILED_GENERAL;
};

function loginInternal(user, hashedPassword, saveUser) {
    if (_tryUser !== user) {
        return Promise.reject(); //call from autologin that is outdated
    }
    _lastParamUser = user;
    _lastParamHashedPw = hashedPassword;
    _lastParamSaveUser = saveUser;
    user = user.trim();

    return authClient
        .login({
            username: user,
            password: hashedPassword
        })
        .then((info) => {
            log.info('login success!');
            loginService.stopAutoRetryLogin();
            _loginInfo = info;
            _loggedInUser = user;
            localStorageService.setLastActiveUser(user);
            localStorageService.setAutologinUser(saveUser ? user : '');
            if (saveUser) {
                localStorageService.saveUserPassword(user, hashedPassword);
            }
            return Promise.resolve();
        });
}

function loginHashedPasswordInternal(user, hashedPassword, saveUser) {
    return loginInternal(user, hashedPassword, saveUser).then(
        () => {
            _retryCount = 0;
            return databaseService
                .initForUser(user, hashedPassword, loginService.getLoggedInUserDatabase(), !saveUser)
                .then(() => {
                    return Promise.resolve(true);
                });
        },
        (reason) => {
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
        }
    );
}

function reasonToErrorCode(reason) {
    if (
        reason &&
        reason.error &&
        reason.error.toLowerCase() === 'unauthorized' &&
        reason.message &&
        reason.message.includes('locked')
    ) {
        return loginService.ERROR_CODE_UNAUTHORIZED;
    }
    if (reason && reason.error && reason.error.toLowerCase() === 'unauthorized') {
        return loginService.ERROR_CODE_UNAUTHORIZED;
    }
    if (
        (reason && reason.message && reason.message.toLowerCase() === 'network error') ||
        (reason && reason.name === 'TypeError')
    ) {
        return loginService.ERROR_CODE_NETWORK_ERROR;
    }
}

function autoRetryLogin(user, hashedPassword, saveUser) {
    loginService.stopAutoRetryLogin();
    _retryCount++;
    let waitTimeSeconds = Math.min(5 + (2 * _retryCount * _retryCount), 30 * 60); // exponentially rising waiting time, max. 30 minutes about at attempt 30
    waitTimeSeconds = Math.round(waitTimeSeconds * util.getRandom(1, 1.5));
    _autoRetryHandler = setTimeout(function () {
        log.info(`auto-retry for online login user ${user} (attempt ${_retryCount}, waited for ${waitTimeSeconds}s)`);
        loginHashedPasswordInternal(user, hashedPassword, saveUser);
    }, waitTimeSeconds * 1000);
}

function init() {
    $(document).on(constants.EVENT_DB_CONNECTION_LOST, function (e) {
        log.info('connection lost! auto-retrying login after 10 seconds...');
        if (_lastParamUser && _lastParamHashedPw) {
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

export { loginService };