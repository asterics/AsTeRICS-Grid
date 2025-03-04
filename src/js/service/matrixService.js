import { dataService } from './data/dataService';
import $ from '../externals/jquery';
import { constants } from '../util/constants';
import { localStorageService } from './data/localStorageService';
import * as Matrix from 'matrix-js-sdk';
import { MatrixConfigLocal } from '../model/MatrixConfigLocal';
import { logger } from 'matrix-js-sdk/lib/logger';

let matrixService = {};

const HOME_SERVER = "https://matrix.org";
const USERNAME_PREFIX = "@";
const USERNAME_POSTFIX = ":matrix.org";
const SYNC_STATE_PREPARED = "PREPARED";

let syncConfig = null;
let localConfig = null;
let matrixClient = null;
let _messageCallback = null;
let loginPromise = null;

matrixService.login = async function () {
    loginPromise = Promise.resolve().then(async () => {
        log.warn(syncConfig, localConfig);
        if (!syncConfig || !(syncConfig.user && syncConfig.password)) {
            return log.warn('cannot login to matrix, no credentials configured!');
        }
        logger.setLevel("silent");
        if (!localConfig.accessToken || !localConfig.deviceId) {
            log.info("matrix: initial login using username and password");
            let tempClient = Matrix.createClient({
                baseUrl: HOME_SERVER
            });
            try {
                let response = await tempClient.loginRequest({
                    type: "m.login.password",
                    user: getFullUser(syncConfig.user),
                    password: syncConfig.password
                }); // returns access_token and device_id*/
                await tempClient.stopClient();
                localConfig.accessToken = response.access_token;
                localConfig.deviceId = response.device_id;
                log.warn("got local config", localConfig)
                saveLocalConfig();
            } catch (e) {
                log.warn("login to matrix failed (user and password)", e);
                await matrixService.logout();
                return false;
            }
        }
        if (localConfig.accessToken && localConfig.deviceId) {
            log.info("matrix: login using access token");
            try {
                matrixClient = Matrix.createClient({
                    baseUrl: HOME_SERVER,
                    accessToken: localConfig.accessToken,
                    userId: getFullUser(syncConfig.user),
                    deviceId: localConfig.deviceId
                });
                await matrixClient.initRustCrypto();
                let cryptoLogger = matrixClient.getCrypto().logger;
                cryptoLogger.disableAll();
                matrixClient.startClient();
                return new Promise(resolve => {
                    matrixClient.once('sync', async function(state) {
                        if (state === SYNC_STATE_PREPARED) {
                            matrixClient.on("Room.timeline", timelineCallback);
                            resolve(true);
                        }
                    });
                });
            } catch (e) {
                log.warn("login to matrix failed (access token)", e);
                await matrixService.logout();
                return false;
            }
        }
        return false;
    });
    return loginPromise;
};

/**
 * resets all internal data and the current matrix client. prepares for logging in with another user.
 */
matrixService.reset = async function() {
    if (matrixClient) {
        await matrixClient.stopClient();
        matrixClient = null;
    }
    loginPromise = null;
    await updateMetadata();
    localConfig = localStorageService.getUserSettings().integrations.matrixConfig;
}

/**
 * Logs out the currently logged in matrix client, deletes device ID and access token.
 * Next login will be done with saved username and password, device has to be verified again.
 * @returns {Promise<void>}
 */
matrixService.logout = async function() {
    if (!matrixClient) {
        return;
    }
    try {
        await matrixClient.store.deleteAllData();
        await matrixClient.stopClient();
        await matrixClient.logout();
    } catch (e) {
        log.warn('error while matrix logout', e);
    }
    localConfig = new MatrixConfigLocal();
    saveLocalConfig();
    await matrixService.reset();
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
    matrixClient.sendEvent(roomId, Matrix.EventType.RoomMessage, messageContent, '', (err, res) => {
        console.log(err);
    });
}

matrixService.getRooms = async function() {
    if (!matrixClient || !loginPromise) {
        return;
    }
    await loginPromise;
    return matrixClient.getRooms();
};

matrixService.getMessageEvents = async function(roomId, pastMessages = 10) {
    if (!matrixClient || !loginPromise) {
        return;
    }
    await loginPromise;
    let room = matrixClient.getRooms().find(room => room.id === roomId);
    if (!room) {
        return;
    }
    let timeline = room.getLiveTimeline();
    await matrixClient.paginateEventTimeline(timeline, {
        backwards: true,
        limit: pastMessages
    });

    // decrypt
    for (const event of timeline.getEvents()) {
        if (event.getType() === Matrix.EventType.RoomMessageEncrypted) {
            await matrixClient.decryptEventIfNeeded(event);
        }
    }

    return timeline.getEvents().filter(e => e.getType() === Matrix.EventType.RoomMessage && !e.isDecryptionFailure());
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
                await matrixClient.decryptEventIfNeeded(event);
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
    userSettings.integrations.matrixConfig.deviceId = localConfig.deviceId;
    userSettings.integrations.matrixConfig.accessToken = localConfig.accessToken;
    localStorageService.saveUserSettings(userSettings);
}

function getFullUser(givenUsername) {
    if (!givenUsername) {
        return '';
    }
    let user = givenUsername;
    user = !user.startsWith(USERNAME_PREFIX) ? USERNAME_PREFIX + user : user;
    user = !user.endsWith(USERNAME_POSTFIX) ? user + USERNAME_POSTFIX : user;
    log.warn('full user', user);
    return user;
}

async function init() {
    await matrixService.reset();
    await matrixService.login();
}

async function updateMetadata() {
    let metadata = await dataService.getMetadata();
    syncConfig = metadata.integrations.matrixConfig;
}

$(document).on(constants.EVENT_USER_CHANGED, init);
$(document).on(constants.EVENT_METADATA_UPDATED, updateMetadata);

export { matrixService };