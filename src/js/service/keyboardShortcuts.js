import {inputEventHandler} from "../input/inputEventHandler";
import {localStorageService} from "./data/localStorageService";
import {dataService} from "./data/dataService";
import {loginService} from "./loginService";

let keyboardShortcuts = {};

/**
 * inits global keyboard shortcuts
 */
keyboardShortcuts.init = function () {
    inputEventHandler.global.onAnyKey((keycode, code, event) => {
        if (event.ctrlKey && event.shiftKey && keycode === 39) { //Ctrl + Shift + Arrow Right
            let users = localStorageService.getSavedUsers();
            let currentUser = dataService.getCurrentUser();
            let index = users.indexOf(currentUser);
            index = index + 1 < users.length ? index + 1 : 0;
            let newUser = users[index];
            log.info('changing user via keyboard shortcut to: ' + newUser);
            loginService.loginStoredUser(newUser);
        }
    });
};

export {keyboardShortcuts};