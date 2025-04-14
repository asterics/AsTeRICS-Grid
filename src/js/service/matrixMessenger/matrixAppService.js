import { GridActionMatrix } from '../../model/GridActionMatrix';
import { collectElementService } from '../collectElementService';
import { matrixService } from './matrixService';
import $ from '../../externals/jquery';
import { constants } from '../../util/constants';

let matrixAppService = {};
let currentRoom = null;

matrixAppService.doAction = async function (action) {
    switch (action.action) {
        case GridActionMatrix.actions.MATRIX_SEND_COLLECTED:

            break;
        case GridActionMatrix.actions.MATRIX_SEND_COLLECTED_TEXT:
            let text = collectElementService.getText();
            let room = await getCurrentRoom();
            if (text && room) {
                await matrixService.sendMessage(room.roomId, text);
            }
            break;
        case GridActionMatrix.actions.MATRIX_SEND_CUSTOM:
            let useRoom = await getCurrentRoom();
            if (action.sendText && useRoom) {
                await matrixService.sendMessage(useRoom.roomId, action.sendText);
            }
            break;
        case GridActionMatrix.actions.MATRIX_NEXT_CONVERSATION:
            await setNextRoom();
            $(document).trigger(constants.EVENT_MATRIX_SET_ROOM, [currentRoom.roomId]);
            break;
        case GridActionMatrix.actions.MATRIX_PREV_CONVERSATION:
            await setNextRoom(-1);
            $(document).trigger(constants.EVENT_MATRIX_SET_ROOM, [currentRoom.roomId]);
            break;
        case GridActionMatrix.actions.MATRIX_SET_CONVERSATION:
            let rooms = await matrixService.getRooms() || [];
            currentRoom = rooms.find(r => r.roomId === action.selectRoomId);
            $(document).trigger(constants.EVENT_MATRIX_SET_ROOM, [action.selectRoomId]);
            break;
        case GridActionMatrix.actions.MATRIX_SCROLL_UP:
            $(document).trigger(constants.EVENT_MATRIX_SCROLL_UP, [action.scrollPx]);
            break;
        case GridActionMatrix.actions.MATRIX_SCROLL_DOWN:
            $(document).trigger(constants.EVENT_MATRIX_SCROLL_DOWN, [action.scrollPx]);
            break;
    }
};

matrixAppService.getCurrentRoom = function() {
    return currentRoom;
};

async function getCurrentRoom() {
    if (currentRoom) {
        return currentRoom;
    }
    let rooms = await matrixService.getRooms() || [];
    return rooms[0];
}

async function setNextRoom(inc = 1) {
    let rooms = await matrixService.getRooms() || [];
    if (!rooms.length) {
        currentRoom = null;
        return;
    }
    let newIndex;
    if (!currentRoom) {
        newIndex = inc;
    } else {
        let index = rooms.findIndex(r => r.roomId === currentRoom.roomId);
        newIndex = index !== -1 ? index + inc : 0;
    }
    newIndex = newIndex < 0 ? rooms.length - 1 : newIndex;
    newIndex = newIndex % rooms.length;
    currentRoom = rooms[newIndex];
}

export { matrixAppService };