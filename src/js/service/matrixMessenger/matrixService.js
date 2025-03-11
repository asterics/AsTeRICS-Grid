import { matrixAdapter } from './matrixAdapter';
import * as Matrix from 'matrix-js-sdk';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';

let matrixService = {};

let _messageCallback = null;

matrixService.getUserId = function() {
    return matrixAdapter.getUserId();
}

matrixService.login = function() {
    matrixAdapter.setTimelineCallback(timelineCallback);
    return matrixAdapter.login();
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
        log.warn("send to roomId", roomId);
        client.sendEvent(roomId, Matrix.EventType.RoomMessage, messageContent, '', (err, res) => {
            console.log(err);
        });
    });
}

matrixService.getRooms = async function() {
    log.warn("GET ROOMS1");
    return await matrixAdapter.doWithClient(client => {
        log.warn("GET ROOMS");
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

        return timeline.getEvents().filter(e => e.getType() === Matrix.EventType.RoomMessage && !e.isDecryptionFailure());
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
                _messageCallback(event);
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

$(document).on(constants.EVENT_USER_CHANGED, matrixService.login);

export { matrixService };