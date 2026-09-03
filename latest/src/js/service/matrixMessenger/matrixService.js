import { matrixAdapter } from './matrixAdapter';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';
import { MatrixMessage } from '../../model/MatrixMessage';
import { matrixUtil } from './matrixUtil';
import { imageUtil } from '../../util/imageUtil';
import { util } from '../../util/util';
import { i18nService } from '../i18nService';

let matrixService = {};

matrixService.LOGIN_RESULTS = matrixAdapter.LOGIN_RESULTS;
const MEGOLM_ENCRYPTION_ALGORITHM = "m.megolm.v1.aes-sha2";

let MatrixLib = null;

let _messageCallback = null;
let _roomChangeCallback = null;

matrixService.getUsername = async function(full = false) {
    return matrixAdapter.getUsername(full);
}

matrixService.isEncryptionEnabled = function() {
    return matrixAdapter.isEncryptionEnabled();
}

/**
 * logs in to matrix with given credentials. If no credentials given, saved credentials are used.
 * @param syncConfig {MatrixConfigSync} the config to login (username, password, homeserver), optional
 *                                      if not specified, saved data from metadata is used
 * @returns {Promise<matrixService.LOGIN_RESULTS>}
 */
matrixService.login = function(syncConfig = null) {
    matrixAdapter.setTimelineCallback(timelineCallback);
    return matrixAdapter.login(syncConfig);
}

matrixService.logout = function() {
    return matrixAdapter.logout();
}

matrixService.onMessage = function(callback) {
    _messageCallback = callback;
}

matrixService.onRoomChange = function(callback) {
    _roomChangeCallback = callback;
}

matrixService.sendMessage = async function(roomId, message) {
    $(document).trigger(constants.EVENT_MATRIX_SENDING_START);
    return await matrixAdapter.doWithClient(async client => {
        const messageContent = {
            body: message,
            msgtype: 'm.text'
        };
        client.sendEvent(roomId, (await Matrix()).EventType.RoomMessage, messageContent, '', (err, res) => {
            console.log(err);
        });
    });
}

matrixService.sendImage = async function(roomId, imageCanvas, imageName = 'image') {
    $(document).trigger(constants.EVENT_MATRIX_SENDING_START);
    return await matrixAdapter.doWithClient(async client => {
        let imageBlob = await imageUtil.canvasToBlob(imageCanvas);
        let uploadResponse = await client.uploadContent(imageBlob, {
            name: imageName,
            type: imageBlob.type
        });
        const imageMessage = {
            body: imageName + ".png",
            msgtype: 'm.image',
            url: uploadResponse.content_uri,
            info: {
                mimetype: imageBlob.type,
                size: imageBlob.size,
                w: imageCanvas.width,
                h: imageCanvas.height
            }
        };
        client.sendEvent(roomId, (await Matrix()).EventType.RoomMessage, imageMessage, '', (err, res) => {
            console.log(err);
        });
    });
}

matrixService.getRooms = async function() {
    return await matrixAdapter.doWithClient(client => {
        let rooms = client.getRooms();
        rooms.sort((a, b) => a.name.localeCompare(b.name));
        return rooms.filter(room => ['join', 'invite'].includes(room.getMyMembership()));
    });
};

matrixService.createPrivateRoom = async function (username, enableEncryption = false, roomName = undefined) {
    return matrixAdapter.doWithClient(async client => {
        try {
            let fullUser = matrixAdapter.getFullUserByName(username);
            const roomOptions = {
                visibility: 'private',
                invite: [fullUser],
                name: roomName || undefined,
                room_version: "9", // RestrictedRoom
                preset: "private_chat"
            };
            if (enableEncryption) {
                roomOptions.initial_state = [{
                    type: 'm.room.encryption', state_key: '', content: {
                        algorithm: MEGOLM_ENCRYPTION_ALGORITHM
                    }
                }];
            }

            const roomResponse = await client.createRoom(roomOptions);
            return roomResponse.room_id;
        } catch (error) {
            log.warn('matrix: error creating room or inviting user:', error);
        }
        return null;
    });
}

matrixService.leaveRoom = function(roomId) {
    return matrixAdapter.doWithClient(async client => {
        client.leave(roomId);
    });
};

matrixService.getMessageEvents = async function(roomId, pastMessages = 10) {
    return await matrixAdapter.doWithClient(async client => {
        let room = client.getRooms().find(room => room.roomId === roomId);
        if (!room) {
            return;
        }
        let timeline = room.getLiveTimeline();
        if (pastMessages) {
            await client.paginateEventTimeline(timeline, {
                backwards: true,
                limit: pastMessages
            });
        }

        // decrypt
        for (const event of timeline.getEvents()) {
            if (event.getType() === (await Matrix()).EventType.RoomMessageEncrypted) {
                await client.decryptEventIfNeeded(event);
            }
        }

        let MatrixLib = (await Matrix());
        let events = timeline.getEvents().filter(e => e.getType() === MatrixLib.EventType.RoomMessage && !e.isDecryptionFailure());
        return await matrixEventsToMessage(events);
    });
}

matrixService.existsUser = async function(username) {
    return matrixAdapter.existsUser(username);
}

matrixService.getFullUsername = function(username) {
    return matrixAdapter.getFullUserByName(username);
}

async function timelineCallback(event, room, toStartOfTimeline) {
    console.log(event.event);
    switch (event.getType()) {
        case (await Matrix()).EventType.RoomMessage:
            console.log(`📩 New message: ${event.getContent().body}`);
            if (_messageCallback) {
                _messageCallback(await matrixEventToMessage(event));
            }
            break;

        case 'm.reaction':
            console.log(`Reaction added: ${event.getContent().m_relates_to.key}`);
            break;

        case 'm.room.member':
            console.log(`User membership changed: ${event.getSender()} is now ${event.getContent().membership}`);
            if (_roomChangeCallback) {
                setTimeout(async () => {
                    let rooms = await matrixService.getRooms();
                    _roomChangeCallback(rooms);
                }, 500);
            }
            break;

        default:
            console.log(`Received event: ${event.getType()}`);
    }
}

async function matrixEventsToMessage(events = []) {
    return await Promise.all(events.map(async event => matrixEventToMessage(event)));
}

async function matrixEventToMessage(event) {
    return matrixAdapter.doWithClient(async client => {
        let timestamp = event.getTs();
        let date = new Date(timestamp);
        let dateReadable;
        if (util.isSameDate(date, new Date())) {
            dateReadable = date.toLocaleTimeString(i18nService.getContentLang(), { hour: 'numeric', minute: 'numeric' });
        } else {
            dateReadable = date.toLocaleTimeString(i18nService.getContentLang(), { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' });
        }
        let message = new MatrixMessage({
            msgType: event.getContent().msgtype,
            sender: event.sender.name,
            senderId: event.getSender(),
            isDeleted: event.isRedacted(),
            textContent: event.getContent().body,
            roomId: event.getRoomId(),
            timestamp: timestamp,
            dateTimeReadable: dateReadable
        });
        if (event.getContent().msgtype === 'm.image') {
            message.imageUrl = await matrixUtil.imageMessageEventToBlobUrl(event, await matrixAdapter.getCurrentAccessToken(), client);
            message.imageName = message.textContent;
            message.textContent = message.textContent.replace(/\.(svg|jpe?g|png|gif|webp)$/i, '');
        }
        return message;
    });
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

$(document).on(constants.EVENT_USER_CHANGED, () => {
    matrixService.login();
});

export { matrixService };