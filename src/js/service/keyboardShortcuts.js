import { inputEventHandler } from '../input/inputEventHandler';
import { localStorageService } from './data/localStorageService';
import { dataService } from './data/dataService';
import { loginService } from './loginService';
import { Router } from '../router.js';
import { actionService } from './actionService.js';
import { GridActionNavigate } from '../model/GridActionNavigate.js';

let keyboardShortcuts = {};

/**
 * inits global keyboard shortcuts
 */
keyboardShortcuts.init = function () {
    inputEventHandler.global.onAnyKey((keycode, code, event) => {
        if (event.ctrlKey && event.shiftKey && keycode === 39) {
            //Ctrl + Shift + Arrow Right
            let users = localStorageService.getSavedUsers();
            let currentUser = dataService.getCurrentUser();
            let index = users.indexOf(currentUser);
            index = index + 1 < users.length ? index + 1 : 0;
            let newUser = users[index];
            log.info('changing user via keyboard shortcut to: ' + newUser);
            loginService.loginStoredUser(newUser);
        }
        if (event.ctrlKey && keycode === 8) {
            //Ctrl + Backspace
            Router.toLastGrid();
        }
        if (event.ctrlKey && keycode === 36) {
            //Ctrl + Pos1
            dataService.getGlobalGrid().then((globalGrid) => {
                if (globalGrid) {
                    for (const elem of globalGrid.gridElements) {
                        if (
                            elem.actions[0].modelName === GridActionNavigate.getModelName() &&
                            !elem.actions[0].toLastGrid
                        ) {
                            Router.toGrid(elem.actions[0].toGridId);
                        }
                    }
                }
            });
        }
    });
};

export { keyboardShortcuts };
