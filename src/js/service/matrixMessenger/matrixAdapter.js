import { dataService } from '../data/dataService';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';
import { localStorageService } from '../data/localStorageService';
import * as Matrix from 'matrix-js-sdk';
import { MatrixConfigLocal } from '../../model/MatrixConfigLocal';
import { logger } from 'matrix-js-sdk/lib/logger';
import { DeviceVerification } from 'matrix-js-sdk/lib/models/device';
import { ClientEvent } from 'matrix-js-sdk/lib/client';
import { util } from '../../util/util';

let matrixAdapter = {};

const USERNAME_PREFIX = "@";
const SYNC_STATE_PREPARED = "PREPARED";
const MATRIX_INDEXED_DB_PREFIX = "matrix-js-sdk:";
const CRYPTO_DB_NAME = ":matrix-sdk-crypto";

let _syncConfig = null;
let _localConfig = null;
let _matrixClient = null;
let _messageCallback = null;
let _loginPromise = null;
let _loggedInUser = null;
let _loggedInDevice = null;

matrixAdapter.getUserId = function() {
    return getFullUser(_localConfig);
};

matrixAdapter.login = async function() {
    if (_loginPromise) {
        await _loginPromise;
    }
    if (_matrixClient && _loggedInUser === _localConfig.user && _loggedInDevice === _localConfig.deviceId) {
        return log.info('matrix: already logged in');
    }
    await matrixAdapter.reset();
    await readConfig();

    _loginPromise = Promise.resolve().then(async () => {
        if (!_syncConfig || !(_syncConfig.user && _syncConfig.password)) {
            return log.warn('cannot login to matrix, no credentials configured!');
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
            let tempClient = Matrix.createClient({
                baseUrl: _syncConfig.homeserver
            });
            try {
                let response = await tempClient.loginRequest({
                    type: 'm.login.password',
                    user: getFullUser(_syncConfig),
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
                await matrixAdapter.reset();
                return false;
            }
        }
        log.info("matrix: login using access token");
        try {
            _matrixClient = await getAccessTokenClient(_localConfig);
            if (!_matrixClient) {
                return log.warn('matrix: init with access token failed, missing some data.');
            }

            if(!localStorageService.anyMatrixUserUsingCrypto() || _localConfig.useCrypto) {
                log.info(`init crypto for matrix user "${_localConfig.user}"...`);
                await _matrixClient.initRustCrypto();
                let cryptoLogger = _matrixClient.getCrypto().logger;
                cryptoLogger.disableAll();
                _localConfig.useCrypto = true;
                saveLocalConfig();
            } else {
                log.info(`Not using crypto for matrix user "${_localConfig.user}" because another user already uses crypto on this device. Multiple users using crypto is currently not supported by matrix-js-sdk.`);
            }

            _matrixClient.startClient();
            return new Promise(resolve => {
                _matrixClient.once('sync', async function(state) {
                    if (state === SYNC_STATE_PREPARED) {
                        _loggedInUser = _localConfig.user;
                        _loggedInDevice = _localConfig.deviceId;
                        _matrixClient.on("Room.timeline", timelineCallback);
                        resolve(true);
                    }
                });
                _matrixClient.on("event", (event) => {
                    console.log("Received event:", event.getType(), event);
                });

                _matrixClient.on("crypto.verificationRequestReceived", async (request) => {
                    console.log(`Verification requested by: ${request.otherUserId}`);

                    request.accept(); // Accept the request
                });
                _matrixClient.on(ClientEvent.ToDeviceEvent, (event) => {
                    console.log("got client event", event, event.getType())
                    if (event.getType() === 'm.key.verification.start') {
                        log.warn("verification start", event.getContent())
                        const transactionId = event.getContent().transaction_id;
                        const verification = _matrixClient.getCrypto().getVerification(event.getSender(), transactionId);
                        log.warn("verification", verification)
                        if (verification) {
                            console.log("Found verification transaction, accepting...", verification);
                            verification.accept();
                        }
                    }
                });
            });
        } catch (e) {
            log.warn("login to matrix failed (access token), logging out...", e);
            await matrixAdapter.logout();
            return false;
        }
        return false;
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
    _localConfig = null;
    _syncConfig = null;
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

async function getAccessTokenClient(localConfig) {
    if (!localConfig || !localConfig.accessToken || !localConfig.deviceId || !localConfig.user) {
        return null;
    }
    const store = new Matrix.IndexedDBStore({
        indexedDB: window.indexedDB,
        dbName: getDBName(localConfig)
    });
    await store.startup();

    return Matrix.createClient({
        baseUrl: localConfig.homeserver,
        accessToken: localConfig.accessToken,
        userId: getFullUser(localConfig),
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

async function timelineCallback(event, room, toStartOfTimeline) {
    console.log(event.event);
    switch (event.getType()) {
        case Matrix.EventType.RoomMessage:
            console.log(`📩 New message: ${event.getContent().body}`);
            if (_messageCallback) {
                _messageCallback(event);
            }
            break;

        case Matrix.EventType.RoomMessageEncrypted:
            try {
                await _matrixClient.decryptEventIfNeeded(event);
                console.log(`Decrypted message: ${event.getContent().body}`);
                if (_messageCallback) {
                    _messageCallback(event);
                }
            } catch (err) {
                console.error('❌ Failed to decrypt:', err);
            }
            break;

        case 'm.reaction':
            console.log(`Reaction added: ${event.getContent().m_relates_to.key}`);
            break;

        case 'm.room.member':
            console.log(`User membership changed: ${event.getSender()} is now ${event.getContent().membership}`);
            break;

        default:
            console.log(`Received event: ${event.getType()}`);
    }
}

function saveLocalConfig() {
    let userSettings = localStorageService.getUserSettings();
    userSettings.integrations.matrixConfig = _localConfig;
    localStorageService.saveUserSettings(userSettings);
}

function getFullUser(config) {
    if (!config || !config.user || !config.homeserver) {
        return '';
    }
    let user = config.user;
    let homeserverPostifx = '';
    try {
        let parsedHomeserverUrl = new URL(config.homeserver);
        homeserverPostifx = `:${parsedHomeserverUrl.host}`;
    } catch (e) {
        log.warn("matrix: error parsing homeserver url");
        return '';
    }
    user = !user.startsWith(USERNAME_PREFIX) ? USERNAME_PREFIX + user : user;
    user = !user.endsWith(homeserverPostifx) ? user + homeserverPostifx : user;
    return user;
}

async function readConfig() {
    await readSyncConfig();
    let userSettings = localStorageService.getUserSettings();
    _localConfig = userSettings && userSettings.integrations ? userSettings.integrations.matrixConfig : null;
}

function getDBName(localConfig, withPrefix = false) {
    let name = `matrix-store-${getFullUser(localConfig)}-${localConfig.deviceId}`;
    return withPrefix ? MATRIX_INDEXED_DB_PREFIX + name : name;
}

async function readSyncConfig() {
    let metadata = await dataService.getMetadata();
    _syncConfig = metadata.integrations.matrixConfig;
}

async function onUserDeleted(event, username, localSettings) {
    if (localSettings && localSettings.integrations && localSettings.integrations.matrixConfig) {
        await matrixAdapter.logout(localSettings.integrations.matrixConfig, true);
    }
}

$(document).on(constants.EVENT_USER_CHANGED, matrixAdapter.login);
$(document).on(constants.EVENT_METADATA_UPDATED, readSyncConfig);
$(document).on(constants.EVENT_USER_DELETED, onUserDeleted);

export { matrixAdapter };