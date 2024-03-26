import { constants } from '../../util/constants';
import { MetaData } from '../../model/MetaData';
import { SettingsApp } from '../../model/SettingsApp.js';
import $ from "../../externals/jquery.js";

let errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
let USER_PASSWORDS_KEY = 'USER_PASSWORDS_KEY';
let USER_MODELVERSION_KEY = 'USER_MODELVERSION_KEY';
let SYNCED_DBS_LIST_KEY = 'SYNCED_DBS_LIST_KEY';
let LAST_ACTIVEUSER_KEY = 'LAST_ACTIVEUSER_KEY';
let AUTOLOGIN_USER_KEY = 'AUTOLOGIN_USER_KEY';
let LOCAL_METADATA_KEY = 'AG_LOCAL_METADATA_KEY';
let GRID_DIMENSIONS_KEY = 'AG_GRID_DIMENSIONS_KEY';
let USED_LOCALES_KEY = 'AG_USED_LOCALES_KEY';
let YT_STATE_KEY = 'AG_YT_STATE_KEY';
let APP_SETTINGS = 'AG_APP_SETTINGS';
let CURRENT_VERSION_KEY = 'AG_CURRENT_VERSION_KEY';

let localStorageService = {};
let storage = window.localStorage;

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
 * returns a previously saved user password
 * @param username the username as used for login
 * @return {*}
 */
localStorageService.getUserPassword = function (username) {
    if (!username) {
        return null;
    }
    return getSaveObject(USER_PASSWORDS_KEY)[username];
};

/**
 * saves a given local user without a password
 * @param username the username of the local user to save
 */
localStorageService.saveLocalUser = function (username) {
    let object = getSaveObject(USER_PASSWORDS_KEY);
    object[username] = '';
    localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
};

/**
 * checks if the given username is a saved local user without password
 * @param username the username to check
 * @return true if the given username is a saved local user without password, false otherwise
 */
localStorageService.isSavedLocalUser = function (username) {
    let object = getSaveObject(USER_PASSWORDS_KEY);
    return object[username] === '';
};

/**
 * checks if the last active user is a local user (not synced with cloud)
 */
localStorageService.isLastActiveUserLocal = function () {
    let object = getSaveObject(USER_PASSWORDS_KEY);
    return object[localStorageService.getLastActiveUser()] === '';
};

/**
 * saves a given user password
 * @param username the username as used for login
 * @param password the password to save (should be salted + hashed)
 */
localStorageService.saveUserPassword = function (username, password) {
    let object = getSaveObject(USER_PASSWORDS_KEY);
    object[username] = password;
    localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
};

/**
 * removes a saved password of a given user from local storage, if autologin user is the given username,
 * autologin user is cleared.
 * @param username the username as used for login
 */
localStorageService.removeUserPassword = function (username) {
    let object = getSaveObject(USER_PASSWORDS_KEY);
    delete object[username];
    localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
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
    let object = getSaveObject(USER_PASSWORDS_KEY);
    let allUsers = Object.keys(object) || [];
    return allUsers
        .filter((username) => object[username] === '')
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
    let object = getSaveObject(USER_PASSWORDS_KEY);
    let allUsers = Object.keys(object) || [];
    return allUsers.filter((username) => object[username] !== '').sort();
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
    let object = getSaveObject(USER_MODELVERSION_KEY);
    let modelVersionString = object[user];
    let majorNumber = !modelVersionString ? 1 : parseInt(JSON.parse(object[user]).major);
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
        let object = getSaveObject(USER_MODELVERSION_KEY);
        object[user] = modelVersionString;
        localStorageService.save(USER_MODELVERSION_KEY, JSON.stringify(object));
    }
};

localStorageService.getAppSettings = function () {
    let data = localStorageService.getJSON(APP_SETTINGS);
    return new SettingsApp(data);
};

localStorageService.saveAppSettings = function (settings) {
    settings = settings || {};
    let existingSettings = localStorageService.getAppSettings();
    Object.assign(existingSettings, settings);
    localStorageService.saveJSON(APP_SETTINGS, existingSettings);
    $(document).trigger(constants.EVENT_APPSETTINGS_UPDATED, existingSettings);
};

localStorageService.saveLocalMetadata = function (metadata) {
    let user = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    let object = getSaveObject(LOCAL_METADATA_KEY);
    object[user] = metadata;
    return localStorageService.save(LOCAL_METADATA_KEY, JSON.stringify(object));
};

localStorageService.getLocalMetadata = function () {
    let user = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
    let object = getSaveObject(LOCAL_METADATA_KEY);
    return object[user];
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

localStorageService.getYTState = function (full) {
    let json = localStorageService.get(YT_STATE_KEY);
    if (full) {
        return json ? JSON.parse(json) : null;
    }
    return json ? JSON.parse(json)[localStorageService.getAutologinUser()] : null;
};

localStorageService.saveYTState = function (state) {
    let currentFullState = localStorageService.getYTState(true) || {};
    currentFullState[localStorageService.getAutologinUser()] = state;
    return localStorageService.save(YT_STATE_KEY, JSON.stringify(currentFullState));
};

localStorageService.getCurrentAppVersion = function () {
    return localStorageService.get(CURRENT_VERSION_KEY);
};

localStorageService.setCurrentAppVersion = function (versionString) {
    localStorageService.save(CURRENT_VERSION_KEY, versionString);
};

function getSaveObject(key) {
    let objectString = localStorageService.get(key);
    let object = JSON.parse(objectString);
    let isObject = object instanceof Object;
    if (key === LOCAL_METADATA_KEY && object && object.modelName === MetaData.getModelName()) {
        let user = localStorageService.getAutologinUser() || localStorageService.getLastActiveUser();
        let value = {};
        value[user] = object;
        localStorageService.save(key, JSON.stringify(value));
        return value;
    }
    if (!objectString || !isObject) {
        localStorageService.save(key, JSON.stringify({}));
        return {};
    }
    return object;
}

function getSyncedDbsList() {
    let syncedDbsString = localStorageService.get(SYNCED_DBS_LIST_KEY);
    if (!syncedDbsString) {
        localStorageService.save(SYNCED_DBS_LIST_KEY, JSON.stringify([]));
        return [];
    }
    return JSON.parse(syncedDbsString);
}

export { localStorageService };
