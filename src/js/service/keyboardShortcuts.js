import { inputEventHandler } from '../input/inputEventHandler';
import { localStorageService } from './data/localStorageService';
import { dataService } from './data/dataService';
import { loginService } from './loginService';
import { Router } from '../router.js';
import {MainVue} from "../vue/mainVue.js";

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
            Router.toMain();
        }
        if (event.ctrlKey && keycode === 75) {
            //Ctrl + K
            event.preventDefault();
            let validViews = [Router.VIEWS.AllGridsView, Router.VIEWS.GridView, Router.VIEWS.GridEditView];
            if (validViews.includes(Router.getCurrentView())) {
                MainVue.showSearchModal();
            }
        }
    });
};

export { keyboardShortcuts };
