import { matrixAdapter } from './matrixAdapter';
import * as Matrix from 'matrix-js-sdk';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';
import { MatrixMessage } from '../../model/MatrixMessage';
import { matrixUtil } from './matrixUtil';

let matrixService = {};

matrixService.LOGIN_RESULTS = matrixAdapter.LOGIN_RESULTS;

let _messageCallback = null;

matrixService.getUserId = function() {
    return matrixAdapter.getUserId();
}

matrixService.getLoggedInUsername = async function() {
    return matrixAdapter.getLoggedInUsername();
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

matrixService.sendMessage = async function(roomId, message) {
    return await matrixAdapter.doWithClient(async client => {
        const messageContent = {
            body: message,
            msgtype: 'm.text'
        };
        client.sendEvent(roomId, Matrix.EventType.RoomMessage, messageContent, '', (err, res) => {
            console.log(err);
        });
    });
}

matrixService.getRooms = async function() {
    return await matrixAdapter.doWithClient(client => {
        return client.getRooms();
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
            if (event.getType() === Matrix.EventType.RoomMessageEncrypted) {
                await client.decryptEventIfNeeded(event);
            }
        }

        let events = timeline.getEvents().filter(e => e.getType() === Matrix.EventType.RoomMessage && !e.isDecryptionFailure());
        return await matrixEventsToMessage(events);
    });
}

matrixService.existsUser = async function(config) {
    return await matrixAdapter.doWithClient(async client => {
        try {
            await client.getProfileInfo(getFullUser(config)); // TODO: fix
            return true;
        } catch (error) {
        }
        return false;
    });
}

async function timelineCallback(event, room, toStartOfTimeline) {
    console.log(event.event);
    switch (event.getType()) {
        case Matrix.EventType.RoomMessage:
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
        let message = new MatrixMessage({
            msgType: event.getContent().msgtype,
            sender: event.getSender(),
            isDeleted: event.isRedacted(),
            textContent: event.getContent().body,
            roomId: event.getRoomId()
        });
        if (event.getContent().msgtype === 'm.image') {
            message.imageUrl = await matrixUtil.imageMessageEventToBlobUrl(event, await matrixAdapter.getCurrentAccessToken(), client);
        }
        return message;
    });
}

$(document).on(constants.EVENT_USER_CHANGED, () => {
    matrixService.login();
});

export { matrixService };