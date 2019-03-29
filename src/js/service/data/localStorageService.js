var errorMsg = 'could not access local storage, maybe disabled by user? Error: ';
var storage = null;
let FIRST_VISIT_KEY = 'FIRST_VISIT_KEY';
let USER_PASSWORDS_KEY = "USER_PASSWORDS_KEY";
let LAST_ACTIVEUSER_KEY = "LAST_ACTIVEUSER_KEY";
let AUTOLOGIN_USER_KEY = "AUTOLOGIN_USER_KEY";

if (typeof (Storage) !== "undefined") {
    try {
        var storage = window.localStorage;
    } catch (e) {
        log.error(errorMsg + e)
    }
}

var localStorageService = {
    save: function (key, value) {
        if (storage) {
            try {
                return storage.setItem(key, value);
            } catch (e) {
                log.error(errorMsg + e)
            }
        }
    },
    get: function (key) {
        if (storage) {
            try {
                return storage.getItem(key);
            } catch (e) {
                log.error(errorMsg + e)
            }
        }
    },
    remove: function (key) {
        if (storage) {
            try {
                return storage.removeItem(key);
            } catch (e) {
                log.error(errorMsg + e)
            }
        }
    },
    /**
     * returns true if the page was never visited before and this method was never called before.
     * returns false afterwards.
     * @return {boolean}
     */
    isFirstPageVisit() {
        let value = localStorageService.get(FIRST_VISIT_KEY);
        localStorageService.save(FIRST_VISIT_KEY, true);
        return !value;
    },
    /**
     * returns a previously saved user password
     * @param username the username as used for login
     * @return {*}
     */
    getUserPassword(username) {
        if (!username) {
            return null;
        }
        return getPasswordObject()[username];
    },
    /**
     * saves a given local user without a password
     * @param username the username of the local user to save
     */
    saveLocalUser(username) {
        let object = getPasswordObject();
        object[username] = '';
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
    },
    /**
     * checks if the given username is a saved local user without password
     * @param username the username to check
     * @return true if the given username is a saved local user without password, false otherwise
     */
    isSavedLocalUser(username) {
        let object = getPasswordObject();
        return object[username] === '';
    },
    /**
     * saves a given user password
     * @param username the username as used for login
     * @param password the password to save (should be salted + hashed)
     */
    saveUserPassword(username, password) {
        let object = getPasswordObject();
        object[username] = password;
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
    },
    /**
     * removes a saved password of a given user from local storage
     * @param username the username as used for login
     */
    removeUserPassword(username) {
        let object = getPasswordObject();
        delete object[username];
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify(object));
    },
    /**
     * returns all saved users as a string list
     * @param loggedInUser (optional) if specified the logged in user is returned at first element in the list, if it is
     *                     included in the list of all saved users
     */
    getSavedUsers(loggedInUser) {
        let localUsers = localStorageService.getSavedLocalUsers();
        let onlineUsers = localStorageService.getSavedOnlineUsers();
        let allUsers = onlineUsers.concat(localUsers);
        if (loggedInUser && allUsers.includes(loggedInUser)) {
            allUsers = allUsers.filter(user => user !== loggedInUser);
            allUsers.unshift(loggedInUser);
        }
        return allUsers;
    },
    /**
     * returns all saved offline/local users as a string list
     */
    getSavedLocalUsers() {
        let object = getPasswordObject();
        let allUsers = Object.keys(object) || [];
        return allUsers.filter(username => object[username] === '').sort();
    },
    /**
     * returns all saved online users as a string list
     */
    getSavedOnlineUsers() {
        let object = getPasswordObject();
        let allUsers = Object.keys(object) || [];
        return allUsers.filter(username => object[username] !== '').sort();
    },
    /**
     * saves the last active user by username
     */
    setLastActiveUser(username) {
        localStorageService.save(LAST_ACTIVEUSER_KEY, username);
    },
    /**
     * retrieves the last active user
     */
    getLastActiveUser() {
        return localStorageService.get(LAST_ACTIVEUSER_KEY);
    },
    /**
     * saves a user that should be auto-logged in at startup
     */
    setAutologinUser(username) {
        localStorageService.save(AUTOLOGIN_USER_KEY, username);
    },
    /**
     * retrieves the user that should be auto-logged in at startup
     */
    getAutologinUser() {
        return localStorageService.get(AUTOLOGIN_USER_KEY);
    }
};

function getPasswordObject() {
    let passwordsObjectString = localStorageService.get(USER_PASSWORDS_KEY);
    if (!passwordsObjectString) {
        localStorageService.save(USER_PASSWORDS_KEY, JSON.stringify({}));
        return {};
    }
    return JSON.parse(passwordsObjectString);
}

export {localStorageService};