import { inputEventHandler } from '../input/inputEventHandler';
import { localStorageService } from './data/localStorageService';
import { dataService } from './data/dataService';
import { loginService } from './loginService';
import { Router } from '../router.js';
import {MainVue} from "../vue/mainVue.js";
import { util } from '../util/util';
import { constants } from '../util/constants';
import { eastereggService } from './eastereggService';

let keyboardShortcuts = {};
let lastTyped = '';

/**
 * inits global keyboard shortcuts
 */
keyboardShortcuts.init = function () {
    inputEventHandler.global.onAnyKey(async (keycode, code, event) => {
        const ctrlOrMeta = constants.IS_MAC ? event.metaKey : event.ctrlKey;
        if (ctrlOrMeta && event.shiftKey && keycode === 39) {
            // Ctrl + Shift + Arrow Right
            let users = localStorageService.getSavedUsers();
            let currentUser = dataService.getCurrentUser();
            let index = users.indexOf(currentUser);
            index = index + 1 < users.length ? index + 1 : 0;
            let newUser = users[index];
            log.info('changing user via keyboard shortcut to: ' + newUser);
            loginService.loginStoredUser(newUser);
        }
        if (ctrlOrMeta && keycode === 8) {
            // Ctrl + Backspace
            Router.toLastGrid();
        }
        if (ctrlOrMeta && keycode === 36) {
            // Ctrl + Pos1
            Router.toMain();
        }
        if (ctrlOrMeta && keycode === 70) {
            // Ctrl + F
            event.preventDefault();
            let validViews = [Router.VIEWS.AllGridsView, Router.VIEWS.GridView, Router.VIEWS.GridEditView];
            if (validViews.includes(Router.getCurrentView())) {
                MainVue.showSearchModal();
            }
        }
        if (Router.isOnGridView() && ctrlOrMeta && keycode === 67) {
            // Ctrl + C
            await util.copyCollectContentToClipboard();
        }

        if (!event.key) {
            return;
        }
        lastTyped = eastereggService.checkTypedWord(lastTyped + event.key);
    });
};

export { keyboardShortcuts };
