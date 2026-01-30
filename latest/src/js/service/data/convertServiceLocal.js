import {modelUtil} from "../../util/modelUtil.js";
import {SettingsApp} from "../../model/SettingsApp.js";
import {localStorageService} from "./localStorageService.js";
import {constants} from "../../util/constants.js";
import {SettingsUserLocal} from "../../model/SettingsUserLocal.js";
import {MetaData} from "../../model/MetaData.js";

let convertServiceLocal = {};

let DEPRECATED_UNLOCK_PASSCODE_KEY = 'AG_UNLOCK_PASSCODE_KEY';
let DEPRECATED_SYNC_NAVIGATION_KEY = 'AG_SYNC_NAVIGATION_KEY';

let DEPRECATED_CUSTOM_LANGUAGE_KEY = 'CUSTOM_LANGUAGE_KEY';
let DEPRECATED_USER_PASSWORDS_KEY = 'USER_PASSWORDS_KEY';
let DEPRECATED_USER_MODELVERSION_KEY = 'USER_MODELVERSION_KEY';
let DEPRECATED_LOCAL_METADATA_KEY = 'AG_LOCAL_METADATA_KEY';
let DEPRECATED_YT_STATE_KEY = 'AG_YT_STATE_KEY';

/**
 * update data model of given objects
 * @param objects objects with current or outdated data model, can be array or single object
 * @return {*} array or single object (depending on param objects) with updated/current data model,
 *             passed objects are also changed to conform with updated data model
 */
convertServiceLocal.updateDataModel = function (objects) {
    return modelUtil.convertObjects(objects, getModelConversionFunctions);
};

/**
 * returns a list of filter functions that are needed to apply to convert a given object with modelVersion
 * "objectMajorModelVersion" to the latest modelVersion.
 * @param objectModelVersion the model version of the object
 * @return {Array} list of functions to be applied to bring the object to the current modelVersion
 */
function getModelConversionFunctions(objectModelVersion) {
    if (objectModelVersion.major === modelUtil.getLatestModelVersionLocal().major) {
        return [];
    }

    let filterFns = [];
    // after adding a breaking modelVersion Change just uncomment the following switch statement and
    // insert a conversion function from major version x to major version y
    // for more conversions switch fallthrough is intended - all needed conversion functions are added
    switch (objectModelVersion.major) {
        case null:
            filterFns.push(function (object) {
                // fn from no version (null) to V1
                if (!object) {
                    return object;
                }

                if (object instanceof SettingsApp) {
                    object.appLang = object.appLang !== undefined ? object.appLang : localStorageService.get(DEPRECATED_CUSTOM_LANGUAGE_KEY);
                    object.unlockPasscode = object.unlockPasscode !== undefined ? object.unlockPasscode : localStorageService.getJSON(DEPRECATED_UNLOCK_PASSCODE_KEY);
                    object.syncNavigation = object.syncNavigation !== undefined ? object.syncNavigation : localStorageService.getJSON(DEPRECATED_SYNC_NAVIGATION_KEY);
                }
                
                if (object instanceof SettingsUserLocal) {
                    let user = object.username; // set in localStorageService.getUserSettings()

                    object.modelVersionDb = object.modelVersionDb !== undefined ? object.modelVersionDb : getDeprecatedUserData(user, DEPRECATED_USER_MODELVERSION_KEY);
                    object.password = object.password !== undefined ? object.password : getDeprecatedUserData(user, DEPRECATED_USER_PASSWORDS_KEY);
                    object.metadata = object.metadata !== undefined ? object.metadata : getDeprecatedUserData(user, DEPRECATED_LOCAL_METADATA_KEY);
                    object.ytState = object.ytState !== undefined ? object.ytState : getDeprecatedUserData(user, DEPRECATED_YT_STATE_KEY);
                }

                object.modelVersion = constants.MODEL_VERSION_LOCAL;
                return object;
            });
        //no break intended!
        /*case 1:
            filterFns.push(function (object) {
                //fn from V1 to V2
                if (!object) return;
                return object;
            });*/
        //no break intended!
    }
    return filterFns;
}

function getDeprecatedUserData(user, key) {
    let object = localStorageService.getJSON(key) || {};
    let userData = object[user];
    if (userData) {
        return userData;
    }
    if (!userData && key === DEPRECATED_LOCAL_METADATA_KEY && object.modelName === MetaData.getModelName()) {
        return object;
    }
    return undefined;
}

export { convertServiceLocal };
