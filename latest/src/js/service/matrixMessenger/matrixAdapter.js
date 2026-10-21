import { dataService } from '../data/dataService';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';
import { localStorageService } from '../data/localStorageService';
import { MatrixConfigLocal } from '../../model/MatrixConfigLocal';
import { logger } from 'matrix-js-sdk/lib/logger';
import { util } from '../../util/util';
import { MatrixConfigSync } from '../../model/MatrixConfigSync';

let matrixAdapter = {};

const USERNAME_PREFIX = "@";
const SYNC_STATE_PREPARED = "PREPARED";
const MATRIX_INDEXED_DB_PREFIX = "matrix-js-sdk:";
const CRYPTO_DB_NAME = ":matrix-sdk-crypto";

matrixAdapter.LOGIN_RESULTS = {
    SUCCESS: "SUCCESS",
    MISSING_DATA: "MISSING_DATA",
    UNAUTHORIZED: "UNAUTHORIZED",
    NETWORK_ERROR: "NETWORK_ERROR",
    UNKNOWN_ERROR: "UNKNOWN_ERROR"
}

let MatrixLib = null;

let _syncConfig = null;
let _localConfig = null;
let _matrixClient = null;
let _loginPromise = null;
let _loggedInUser = null;
let _loggedInDevice = null;
let _timelineCallback = null;

matrixAdapter.getUsername = async function(full = false) {
    if (_loginPromise) {
        await _loginPromise;
    }
    if (!_matrixClient) {
        return null;
    }
    return full ? _matrixClient.getUserId() : _matrixClient.getUserIdLocalpart();
}

matrixAdapter.isEncryptionEnabled = function() {
    return _localConfig.useCrypto;
}

matrixAdapter.login = async function(syncConfig = null) {
    if (_loginPromise) {
        await _loginPromise;
    }
    _localConfig = await getConfigLocal();
    _syncConfig = syncConfig || (await getSyncConfig());
    if (_matrixClient && _loggedInUser === matrixAdapter.getFullUserByName(_localConfig.user) && _loggedInDevice === _localConfig.deviceId) {
        log.info('matrix: already logged in');
        return matrixAdapter.LOGIN_RESULTS.SUCCESS;
    }
    await matrixAdapter.reset();

    _loginPromise = Promise.resolve().then(async () => {
        if (!_syncConfig || !(_syncConfig.user && _syncConfig.password)) {
            log.debug('matrix: not logging in, no credentials configured!');
            return matrixAdapter.LOGIN_RESULTS.MISSING_DATA;
        }
        if (_localConfig.homeserver && _localConfig.user &&
            (_localConfig.homeserver !== _syncConfig.homeserver || _localConfig.user !== _syncConfig.user)) {
            // logout because _syncConfig contains different data than currently logged-in user
            await matrixAdapter.logout(_localConfig);
        }
        logger.setLevel('silent');
        logger.disableAll(true);
        if (!_localConfig.accessToken || !_localConfig.deviceId) {
            log.info('matrix: initial login using username and password');
            let tempClient = (await Matrix()).createClient({
                baseUrl: _syncConfig.homeserver
            });
            try {
                let response = await tempClient.loginRequest({
                    type: 'm.login.password',
                    user: getFullUserByConfig(_syncConfig),
                    password: _syncConfig.password
                }); // returns access_token and device_id*/
                await tempClient.stopClient();
                _localConfig.accessToken = response.access_token;
                _localConfig.deviceId = response.device_id;
                _localConfig.user = _syncConfig.user;
                _localConfig.homeserver = _syncConfig.homeserver;
                saveLocalConfig();
            } catch (e) {
                log.warn("login to matrix failed (user and password)", e);
                if (e.name === 'ConnectionError') {
                    return matrixAdapter.LOGIN_RESULTS.NETWORK_ERROR;
                } else if (e.name === 'M_FORBIDDEN') {
                    return matrixAdapter.LOGIN_RESULTS.UNAUTHORIZED;
                }
                return matrixAdapter.LOGIN_RESULTS.UNKNOWN_ERROR;
            }
        }
        log.info("matrix: login using access token, deviceId:", _localConfig.deviceId);
        try {
            _matrixClient = await getAccessTokenClient(_localConfig);
            if (!_matrixClient) {
                return log.warn('matrix: init with access token failed, missing some data.');
            }

            try {
                if (!localStorageService.anyMatrixUserUsingCrypto() || _localConfig.useCrypto) {
                    log.info(`init crypto for matrix user "${_localConfig.user}"...`);
                    await _matrixClient.initRustCrypto();
                    let cryptoLogger = _matrixClient.getCrypto().logger;
                    cryptoLogger.disableAll();
                    _localConfig.useCrypto = true;
                    saveLocalConfig();
                } else {
                    log.info(`Not using crypto for matrix user "${_localConfig.user}" because another user already uses crypto on this device. Multiple users using crypto is currently not supported by matrix-js-sdk.`);
                }
            } catch (e) {
                log.info('matrix: failed to init crypto, can be normal if not connected to internet', e);
                const reLoginIfOnline = async () => {
                    log.info('matrix: re-login after being online now.');
                    window.removeEventListener('online', reLoginIfOnline);
                    await matrixAdapter.reset();
                    await matrixAdapter.login();
                };
                window.addEventListener('online', reLoginIfOnline);
            }

            _matrixClient.startClient();
            return new Promise(resolve => {
                _matrixClient.once('sync', async function(state) {
                    if (state === SYNC_STATE_PREPARED) {
                        log.info("matrix: client ready for", getFullUserByConfig(_localConfig));
                        _loggedInUser = matrixAdapter.getFullUserByName(_localConfig.user);
                        _loggedInDevice = _localConfig.deviceId;
                        _matrixClient.on('Room.timeline', async (event, room, toStartOfTimeline) => {
                            if (_timelineCallback) {
                                if(event.getType() === (await Matrix()).EventType.RoomMessageEncrypted) {
                                    await _matrixClient.decryptEventIfNeeded(event);
                                }
                                _timelineCallback(event);
                            }
                        });
                        _matrixClient.on('Room.myMembership', async (room) => {
                            if (room.getMyMembership() === 'invite') {
                                await joinRoom(room.roomId);
                            }
                            if (room.getMyMembership() === 'leave') {
                                log.info("matrix: was removed from room", room.roomId);
                                await _matrixClient.forget(room.roomId);
                            }
                        });
                        resolve(matrixAdapter.LOGIN_RESULTS.SUCCESS);
                    }
                });
            });
        } catch (e) {
            log.warn("login to matrix failed (access token).", e);
        }
        return matrixAdapter.LOGIN_RESULTS.UNKNOWN_ERROR;
    });
    return _loginPromise;
};

matrixAdapter.doWithClient = async function(callback) {
    if (_loginPromise) {
        await _loginPromise;
    }
    if (_matrixClient && callback) {
        return callback(_matrixClient);
    }
    log.warn("matrix: couldn't perform action with client, not initialized.");
};

/**
 * resets all internal data and the current matrix client. prepares for logging in with another user.
 */
matrixAdapter.reset = async function() {
    if (_matrixClient) {
        await _matrixClient.stopClient();
        _matrixClient = null;
    }
    _loginPromise = null;
    _loggedInUser = null;
    _loggedInDevice = null;
}

/**
 * Logs out the currently logged in matrix client, deletes device ID and access token.
 * Next login will be done with saved username and password, device has to be verified again.
 * @param localConfig the local matrix config of the user that should be logged out, if not specified, the current _localConfig is used
 * @param userWasDeleted true, if the user that should be logged out was just deleted - don't save any new local config data
 * @returns {Promise<void>}
 */
matrixAdapter.logout = async function(localConfig = _localConfig, userWasDeleted = false) {
    if(!localConfig || !localConfig.user || !localConfig.accessToken) {
        return log.warn("matrix: couldn't logout, missing data.");
    }

    let client = null;
    let logoutCurrentClient = _syncConfig.user === localConfig.user && _matrixClient;
    if (logoutCurrentClient) {
        client = _matrixClient;
    } else {
        client = await getAccessTokenClient(localConfig);
    }
    log.info("matrix: logging out...", localConfig.user)
    if (client) {
        try {
            await client.stopClient();
            await client.logout();
        } catch (e) {
            log.warn('matrix: error while logout', e);
        }
    }

    if (logoutCurrentClient && !userWasDeleted) {
        log.info("matrix: reset local config...", "deviceId:", _localConfig.deviceId)
        _localConfig = new MatrixConfigLocal();
        saveLocalConfig();
        await matrixAdapter.reset();
    }

    // delete indexedDB databases
    if (localConfig.useCrypto) {
        let dbName = MATRIX_INDEXED_DB_PREFIX + CRYPTO_DB_NAME;
        await deleteIndexedDB(dbName);
    }
    let userDbName = getDBName(localConfig, true);
    await deleteIndexedDB(userDbName);
};

matrixAdapter.setTimelineCallback = function(callback) {
    if (!callback) {
        return;
    }
    _timelineCallback = callback;
};

matrixAdapter.getCurrentAccessToken = async function() {
    if (_loginPromise) {
        await _loginPromise;
    }
    if (_matrixClient && _loggedInUser) {
        return _localConfig.accessToken;
    }
};

matrixAdapter.existsUser = async function(username) {
    if (_loginPromise) {
        await _loginPromise;
    }
    if (!_matrixClient) {
        return false;
    }
    try {
        await _matrixClient.getProfileInfo(matrixAdapter.getFullUserByName(username));
        return true;
    } catch (error) {
    }
    return false;
}

matrixAdapter.getFullUserByName = function(username, homeserver = null) {
    if (!username) {
        return '';
    }
    homeserver = homeserver || new MatrixConfigSync().homeserver;
    let homeserverPostifx = '';
    try {
        let parsedHomeserverUrl = new URL(homeserver);
        homeserverPostifx = `:${parsedHomeserverUrl.host}`;
    } catch (e) {
        log.warn('matrix: error parsing homeserver url');
        return '';
    }
    username = !username.startsWith(USERNAME_PREFIX) ? USERNAME_PREFIX + username : username;
    username = !username.includes(':') ? username + homeserverPostifx : username;
    return username;
};

async function joinRoom(roomId) {
    console.log(`Accepting invite for room: ${roomId}`);
    try {
        await _matrixClient.joinRoom(roomId);
        log.info(`Successfully joined room: ${roomId}`);
    } catch (error) {
        log.warn(`Failed to join room ${roomId}:`, error);
    }
}

async function getRoom(roomId) {
    if (_loginPromise) {
        await _loginPromise;
    }
    let rooms = await _matrixClient.getRooms() || [];
    return rooms.find(r => r.roomId === roomId);
}

async function getAccessTokenClient(localConfig) {
    if (!localConfig || !localConfig.accessToken || !localConfig.deviceId || !localConfig.user) {
        return null;
    }
    const store = new (await Matrix()).IndexedDBStore({
        indexedDB: window.indexedDB,
        dbName: getDBName(localConfig)
    });
    await store.startup();

    return (await Matrix()).createClient({
        baseUrl: localConfig.homeserver,
        accessToken: localConfig.accessToken,
        userId: getFullUserByConfig(localConfig),
        deviceId: localConfig.deviceId,
        store: store
    });
}

function deleteIndexedDB(dbName) {
    log.info("matrix: deleting database...", dbName);
    return new Promise(async resolve => {
        const DBDeleteRequest = window.indexedDB.deleteDatabase(dbName);

        DBDeleteRequest.onerror = (event) => {
            log.warn('matrix: error deleting IndexedDB database', dbName);
            resolve(false);
        };

        DBDeleteRequest.onsuccess = (event) => {
            log.info('matrix: deleted IndexedDB database', dbName);
            resolve(true);
        };

        // make sure that this method resolves always
        await util.sleep(1000);
        resolve(false);
    });
}

function saveLocalConfig() {
    let userSettings = localStorageService.getUserSettings();
    userSettings.integrations.matrixConfig = _localConfig;
    localStorageService.saveUserSettings(userSettings);
}

function getFullUserByConfig(config) {
    if (!config || !config.user || !config.homeserver) {
        return '';
    }
    return matrixAdapter.getFullUserByName(config.user, config.homeserver);
}

function getDBName(localConfig, withPrefix = false) {
    let name = `matrix-store-${getFullUserByConfig(localConfig)}-${localConfig.deviceId}`;
    return withPrefix ? MATRIX_INDEXED_DB_PREFIX + name : name;
}

async function getConfigLocal() {
    let userSettings = localStorageService.getUserSettings();
    return userSettings && userSettings.integrations ? userSettings.integrations.matrixConfig : null;
}

async function getSyncConfig() {
    let metadata = await dataService.getMetadata();
    return metadata.integrations.matrixConfig;
}

async function onUserDeleted(event, username, localSettings) {
    if (localSettings && localSettings.integrations && localSettings.integrations.matrixConfig) {
        await matrixAdapter.logout(localSettings.integrations.matrixConfig, true);
    }
}

/**
 * loads matrix library async - only load if needed.
 * Contains some operators like ?. and ?? which causes app failing to load at iOS 12 devices
 * @returns {Promise<{readonly default: any}|*>}
 * @constructor
 */
async function Matrix() {
    if (MatrixLib) {
        return MatrixLib;
    }
    MatrixLib = await import('matrix-js-sdk');
    return MatrixLib;
}

$(document).on(constants.EVENT_USER_DELETED, onUserDeleted);

export { matrixAdapter };