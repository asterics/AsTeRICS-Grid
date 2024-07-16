import { constants } from '../../util/constants';
import { SettingsApp } from '../../model/SettingsApp.js';
import $ from "../../externals/jquery.js";
import {SettingsUserLocal} from "../../model/SettingsUserLocal.js";

let errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
let DEPRECATED_USER_PASSWORDS_KEY = 'USER_PASSWORDS_KEY';
let SYNCED_DBS_LIST_KEY = 'SYNCED_DBS_LIST_KEY';
let LAST_ACTIVEUSER_KEY = 'LAST_ACTIVEUSER_KEY';
let AUTOLOGIN_USER_KEY = 'AUTOLOGIN_USER_KEY';
let GRID_DIMENSIONS_KEY = 'AG_GRID_DIMENSIONS_KEY';
let USED_LOCALES_KEY = 'AG_USED_LOCALES_KEY';
let CURRENT_VERSION_KEY = 'AG_CURRENT_VERSION_KEY';
let APP_SETTINGS = 'AG_APP_SETTINGS';
let USER_SETTINGS = 'AG_USER_SETTINGS';

let localStorageService = {};
let storage = window.localStorage;
window.service = localStorageService;

/**
 * saves a key/value pair (both string) to local storage
 * @param key
 * @param value
 */
localStorageService.save = function (key, value) {
    if (storage) {
        try {
            return storage.setItem(key, value);
        } catch (e) {
            log.error(errorMsg + e);
        }
    }
};

localStorageService.get = function (key) {
    if (storage) {
        try {
            return storage.getItem(key);
        } catch (e) {
            log.error(errorMsg + e);
        }
    }
};

localStorageService.remove = function (key) {
    if (storage) {
        try {
            return storage.removeItem(key);
        } catch (e) {
            log.error(errorMsg + e);
        }
    }
};

localStorageService.saveJSON = function (key, value) {
    localStorageService.save(key, JSON.stringify(value));
};

localStorageService.getJSON = function (key) {
    return JSON.parse(localStorageService.get(key));
};

/**
 * returns locally saved global app settings
 * @return {SettingsApp}
 */
localStorageService.getAppSettings = function () {
    let data = localStorageService.getJSON(APP_SETTINGS);
    return new SettingsApp(data);
};

/**
 * saves global app settings
 * @param settings full SettingsApp object or part of new settings object to be saved, e.g. {appLang: "en"}
 */
localStorageService.saveAppSettings = function (settings) {
    settings = settings || {};
    let existingSettings = localStorageService.getAppSettings();
    Object.assign(existingSettings, settings);
    localStorageService.saveJSON(APP_SETTINGS, existingSettings);
    $(document).trigger(constants.EVENT_APPSETTINGS_UPDATED, existingSettings);
};

/**
 * returns local user settings
 * @param username optional user to get settings, defaults to current user
 * @return {null|SettingsUserLocal}
 */
localStorageService.getUserSettings = function (username) {
    username = username || localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    if (!username) {
        return new SettingsUserLocal();
    }
    let object = localStorageService.getJSON(USER_SETTINGS) || {};
    let userSettings = object[username] || {};
    userSettings.username = username;
    return new SettingsUserLocal(userSettings);
}

/**
 * saves local user settings
 * @param settings the settings to save, can be full SettingsUserLocal object, or part of settings, e.g. {password: '123'}
 * @param username
 */
localStorageService.saveUserSettings = function (settings, username) {
    settings = settings || {};
    username = settings.username || username || localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    if (!username) {
        return;
    }
    let existingSettings = localStorageService.getUserSettings(username) || {};
    Object.assign(existingSettings, settings);
    let fullSettings = localStorageService.getJSON(USER_SETTINGS) || {};
    fullSettings[username] = existingSettings;
    localStorageService.saveJSON(USER_SETTINGS, fullSettings);
    $(document).trigger(constants.EVENT_USERSETTINGS_UPDATED, existingSettings);
}

localStorageService.getAutoImportedUserSettings = function() {
    let allSettings = localStorageService.getJSON(USER_SETTINGS) || {};
    let autoUsers = Object.keys(allSettings).filter(key => key.startsWith(constants.LOCAL_DEFAULT_USER_PREFIX));
    return autoUsers.map(username => new SettingsUserLocal(allSettings[username]));
}

localStorageService.getNextAutoUserName = function() {
    let allSettings = localStorageService.getJSON(USER_SETTINGS) || {};
    let usernames = Object.keys(allSettings);
    for (let i = 1; i < 20; i++) {
        let newAutoUsername = constants.LOCAL_DEFAULT_USER_PREFIX + i;
        if (!usernames.includes(newAutoUsername)) {
            return newAutoUsername;
        }
    }
    return constants.LOCAL_DEFAULT_USER_PREFIX + 'fallback';
};

/**
 * checks if the given username is a saved local user without password
 * @param username the username to check
 * @return true if the given username is a saved local user without password, false otherwise
 */
localStorageService.isSavedLocalUser = function (username) {
    let settings = localStorageService.getUserSettings(username);
    return settings.password === '';
};

/**
 * saves a given user password
 * @param username the username as used for login
 * @param password the password to save (should be salted + hashed)
 */
localStorageService.saveUserPassword = function (username, password) {
    localStorageService.saveUserSettings({username: username, password: password});
};

/**
 * removes a saved password of a given user from local storage, if autologin user is the given username,
 * autologin user is cleared.
 * @param username the username as used for login
 */
localStorageService.removeLocalUser = function (username) {
    localStorageService.unmarkSyncedDatabase(username);
    let object = localStorageService.getJSON(USER_SETTINGS) || {};
    delete object[username];
    localStorageService.saveJSON(USER_SETTINGS, object);
    let autologinUser = localStorageService.getAutologinUser();
    if (autologinUser === username) {
        localStorageService.setAutologinUser('');
    }
};

/**
 * returns all saved users as a string list
 * @param loggedInUser (optional) if specified the logged in user is returned at first element in the list, if it is
 *                     included in the list of all saved users
 */
localStorageService.getSavedUsers = function (loggedInUser) {
    let localUsers = localStorageService.getSavedLocalUsers();
    let onlineUsers = localStorageService.getSavedOnlineUsers();
    let allUsers = onlineUsers.concat(localUsers);
    if (loggedInUser && allUsers.includes(loggedInUser)) {
        allUsers = allUsers.filter((user) => user !== loggedInUser);
        allUsers.unshift(loggedInUser);
    }
    return allUsers;
};

/**
 * returns all saved offline/local users as a string list
 */
localStorageService.getSavedLocalUsers = function () {
    transferAllUsersNewToOld();
    let object = localStorageService.getJSON(USER_SETTINGS) || {};
    let allUsers = Object.keys(object) || [];
    return allUsers
        .filter((username) => object[username].password === '')
        .sort((a, b) => {
            if (a === constants.LOCAL_DEMO_USERNAME) {
                return 1;
            }
            if (b === constants.LOCAL_DEMO_USERNAME) {
                return -1;
            }
            return a.localeCompare(b);
        });
};

/**
 * returns all saved online users as a string list
 */
localStorageService.getSavedOnlineUsers = function () {
    transferAllUsersNewToOld();
    let object = localStorageService.getJSON(USER_SETTINGS) || {};
    let allUsers = Object.keys(object) || [];
    return allUsers.filter((username) => object[username].password !== '').sort();
};

/**
 * saves the last active user by username
 */
localStorageService.setLastActiveUser = function (username) {
    localStorageService.save(LAST_ACTIVEUSER_KEY, username);
};

/**
 * retrieves the last active user
 */
localStorageService.getLastActiveUser = function () {
    return localStorageService.get(LAST_ACTIVEUSER_KEY);
};

/**
 * saves a user that should be auto-logged in at startup
 */
localStorageService.setAutologinUser = function (username) {
    if (username === constants.LOCAL_DEMO_USERNAME) {
        return;
    }
    localStorageService.save(AUTOLOGIN_USER_KEY, username);
};

/**
 * retrieves the user that should be auto-logged in at startup
 */
localStorageService.getAutologinUser = function () {
    return localStorageService.get(AUTOLOGIN_USER_KEY);
};

/**
 * saves a name of the database that should be marked as "completely synced"
 * @param databaseName the name of the database to save
 * @return {*}
 */
localStorageService.markSyncedDatabase = function (databaseName) {
    let list = getSyncedDbsList();
    if (!list.includes(databaseName)) {
        list.push(databaseName);
    }
    localStorageService.save(SYNCED_DBS_LIST_KEY, JSON.stringify(list));
};

/**
 * returns true if the given database was set to "completely synced" before using method "markSyncedDatabase()"
 * @param databaseName
 * @return {*}
 */
localStorageService.isDatabaseSynced = function (databaseName) {
    return getSyncedDbsList().includes(databaseName);
};

/**
 * unmarks the given database name to be not longer "completely synced"
 * @param databaseName the name of the database to save
 * @return {*}
 */
localStorageService.unmarkSyncedDatabase = function (databaseName) {
    let list = getSyncedDbsList();
    list = list.filter((name) => name !== databaseName);
    localStorageService.save(SYNCED_DBS_LIST_KEY, JSON.stringify(list));
};

/**
 * get the current data model major version of the given user
 * @param user
 * @return {number}
 */
localStorageService.getUserMajorModelVersion = function (user) {
    let settings = localStorageService.getUserSettings(user);
    let modelVersionString = settings.modelVersionDb;
    let majorNumber = !modelVersionString ? 1 : parseInt(JSON.parse(modelVersionString).major);
    return majorNumber;
};

/**
 * set the current data model version of a user. The version is only set, if the given data model
 * major version is greater than the existing data model minor version.
 *
 * @param user the user to set the data model version
 * @param modelVersionString the version string to set (JSON string including major, minor, patch properties)
 */
localStorageService.setUserModelVersion = function (user, modelVersionString) {
    let savedVersion = localStorageService.getUserMajorModelVersion(user);
    let newVersion = JSON.parse(modelVersionString).major;
    if (savedVersion < newVersion) {
        localStorageService.saveUserSettings({modelVersionDb: modelVersionString}, user);
    }
};

localStorageService.saveLastGridDimensions = function (dimensions) {
    return localStorageService.save(GRID_DIMENSIONS_KEY, JSON.stringify(dimensions));
};

localStorageService.getLastGridDimensions = function () {
    let json = localStorageService.get(GRID_DIMENSIONS_KEY);
    return json ? JSON.parse(json) : {};
};

localStorageService.addUsedLocales = function (toAddArray) {
    let json = localStorageService.get(USED_LOCALES_KEY);
    let array = json ? JSON.parse(json) : [];
    array = [...new Set(array.concat(toAddArray))];
    localStorageService.save(USED_LOCALES_KEY, JSON.stringify(array));
};

localStorageService.getUsedLocales = function () {
    let json = localStorageService.get(USED_LOCALES_KEY);
    return json ? JSON.parse(json) : [];
};

localStorageService.getCurrentAppVersion = function () {
    return localStorageService.get(CURRENT_VERSION_KEY);
};

localStorageService.setCurrentAppVersion = function (versionString) {
    localStorageService.save(CURRENT_VERSION_KEY, versionString);
};

function getSyncedDbsList() {
    let syncedDbsString = localStorageService.get(SYNCED_DBS_LIST_KEY);
    if (!syncedDbsString) {
        localStorageService.save(SYNCED_DBS_LIST_KEY, JSON.stringify([]));
        return [];
    }
    return JSON.parse(syncedDbsString);
}

/**
 * transfers user data (username, password) from old local storage object "DEPRECATED_USER_PASSWORDS_KEY" to
 * new SettingsUserLocal objects (saved as single object with key "USER_SETTINGS" in local storage).
 * Is only done once, if no "USER_SETTINGS" object exists.
 */
function transferAllUsersNewToOld() {
    if (localStorageService.getJSON(USER_SETTINGS)) {
        return;
    }
    log.info('transferring user data to new data model...');
    let objectOld = localStorageService.getJSON(DEPRECATED_USER_PASSWORDS_KEY) || {};
    let oldKeys = Object.keys(objectOld) || [];
    for (let key of oldKeys) {
        localStorageService.saveUserSettings({ username: key, password: objectOld[key] });
    }
    if (oldKeys.length === 0) {
        localStorageService.saveJSON(USER_SETTINGS, {});
    }
}

export { localStorageService };
