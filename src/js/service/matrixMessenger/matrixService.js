import { matrixAdapter } from './matrixAdapter';
import * as Matrix from 'matrix-js-sdk';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';
import { MatrixMessage } from '../../model/MatrixMessage';
import { serviceWorkerService } from '../serviceWorkerService';

let matrixService = {};

let _messageCallback = null;
let _expectedAccessTokenRequestUrls = [];

matrixService.getUserId = function() {
    return matrixAdapter.getUserId();
}

matrixService.login = function() {
    serviceWorkerService.addMessageEventListener(onServiceWorkerMessage);
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

function matrixEventToMessage(event) {
    return matrixAdapter.doWithClient(client => {
        let message = new MatrixMessage({
            msgType: event.getContent().msgtype,
            sender: event.getSender(),
            isDeleted: event.isRedacted(),
            textContent: event.getContent().body,
            roomId: event.getRoomId()
        });
        if (event.getContent().msgtype === 'm.image') {
            let url = event.getContent().url || event.getContent().file.url;
            url = client.mxcUrlToHttp(url, undefined, undefined, undefined, false, true, true);
            message.imageUrl = url;
            _expectedAccessTokenRequestUrls.push(url);
        }
        return message;
    });
}

function onServiceWorkerMessage(event) {
    let msg = event.data;
    if (msg.type === constants.SW_MATRIX_REQ_DATA && _expectedAccessTokenRequestUrls.includes(msg.requestUrl)) {
        _expectedAccessTokenRequestUrls = _expectedAccessTokenRequestUrls.filter(url => url !== msg.requestUrl);
        matrixAdapter.doWithClient(async client => {
            event.source.postMessage({
                type: constants.SW_MATRIX_REQ_DATA,
                requestUrl: msg.requestUrl,
                homeserverUrl: client.getHomeserverUrl(),
                accessToken: await matrixAdapter.getCurrentAccessToken()
            });
        });
    }
}

$(document).on(constants.EVENT_USER_CHANGED, matrixService.login);

export { matrixService };