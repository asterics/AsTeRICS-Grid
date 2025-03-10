import { dataService } from './data/dataService';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { localStorageService } from './data/localStorageService';
import * as Matrix from 'matrix-js-sdk';
import { MatrixConfigLocal } from '../model/MatrixConfigLocal';
import { logger } from 'matrix-js-sdk/lib/logger';

let matrixService = {};

const USERNAME_PREFIX = "@";
const SYNC_STATE_PREPARED = "PREPARED";
const MATRIX_INDEXED_DB_PREFIX = "matrix-js-sdk:";
const CRYPTO_DB_NAME = ":matrix-sdk-crypto";

let _syncConfig = null;
let _localConfig = null;
let _matrixClient = null;
let _messageCallback = null;
let _loginPromise = null;

matrixService.getUserId = function() {
    return getFullUser(_localConfig);
};

matrixService.login = async function() {
    _loginPromise = Promise.resolve().then(async () => {
        if (!_syncConfig || !(_syncConfig.user && _syncConfig.password)) {
            return log.warn('cannot login to matrix, no credentials configured!');
        }
        if (_localConfig.homeserver && _localConfig.user &&
            (_localConfig.homeserver !== _syncConfig.homeserver || _localConfig.user !== _syncConfig.user)) {
            // logout because _syncConfig contains different data than currently logged in user
            await matrixService.logout(_localConfig);
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
                await matrixService.logout();
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
            log.warn("login to matrix failed (access token)", e);
            log.info(e);
            //await matrixService.logout();
            return false;
        }
        return false;
    });
    return _loginPromise;
};

/**
 * resets all internal data and the current matrix client. prepares for logging in with another user.
 */
matrixService.reset = async function() {
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
 * @param localConfig the local matrix config of the user that should be logged out, mandatory
 * @param userWasDeleted true, if the user that should be logged out was just deleted - don't save any new local config data
 * @returns {Promise<void>}
 */
matrixService.logout = async function(localConfig, userWasDeleted = false) {
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
        await matrixService.reset();
    }

    // delete indexedDB databases
    if (localConfig.useCrypto) {
        let dbName = MATRIX_INDEXED_DB_PREFIX + CRYPTO_DB_NAME;
        await deleteIndexedDB(dbName);
    }
    let userDbName = getDBName(localConfig, true);
    await deleteIndexedDB(userDbName);
};

matrixService.onMessage = function(callback) {
    _messageCallback = callback;
}

matrixService.sendMessage = function(roomId, message) {
    const messageContent = {
        body: message,
        msgtype: 'm.text'
    };
    log.warn("send to roomId", roomId);
    _matrixClient.sendEvent(roomId, Matrix.EventType.RoomMessage, messageContent, '', (err, res) => {
        console.log(err);
    });
}

matrixService.getRooms = async function() {
    if (!_loginPromise) {
        return;
    }
    await _loginPromise;
    return _matrixClient.getRooms();
};

matrixService.getMessageEvents = async function(roomId, pastMessages = 10) {
    if (!_loginPromise) {
        return;
    }
    await _loginPromise;
    let room = _matrixClient.getRooms().find(room => room.roomId === roomId);
    if (!room) {
        return;
    }
    let timeline = room.getLiveTimeline();
    if (pastMessages) {
        await _matrixClient.paginateEventTimeline(timeline, {
            backwards: true,
            limit: pastMessages
        });
    }

    // decrypt
    for (const event of timeline.getEvents()) {
        if (event.getType() === Matrix.EventType.RoomMessageEncrypted) {
            await _matrixClient.decryptEventIfNeeded(event);
        }
    }

    return timeline.getEvents().filter(e => e.getType() === Matrix.EventType.RoomMessage && !e.isDecryptionFailure());
}

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

async function init() {
    await matrixService.reset();
    await readConfig();
    await matrixService.login();
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
        await matrixService.logout(localSettings.integrations.matrixConfig, true);
    }
}

$(document).on(constants.EVENT_USER_CHANGED, init);
$(document).on(constants.EVENT_METADATA_UPDATED, readSyncConfig);
$(document).on(constants.EVENT_USER_DELETED, onUserDeleted);

export { matrixService };