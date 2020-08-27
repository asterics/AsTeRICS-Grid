import {modelUtil} from "../../util/modelUtil";
import {encryptionService} from "./encryptionService";
import {log} from "../../util/log";
import {InputConfig} from "../../model/InputConfig";
import {InputEventKey} from "../../model/InputEventKey";
import {MetaData} from "../../model/MetaData";
import {GridData} from "../../model/GridData";
import {i18nService} from "../i18nService";
import {GridActionSpeakCustom} from "../../model/GridActionSpeakCustom";
import {GridActionSpeak} from "../../model/GridActionSpeak";

let filterService = {};

/*
Model Version Changelog:
V0 -> V1: Introduction of encryption and modelVersion property on all data models
 */

/**
 * converts "live" objects that are used in memory in the application to objects that are stored to database (encrypted)
 * @param objects the object or objects to be converted, can be a singe object or an array,
 *        must be an instance of an object model defined in model package
 * @param filterOptions object of filter options that is passed to each filter function
 * @return object of list of objects that is/are ready for saving to database
 */
filterService.convertLiveToDatabaseObjects = function (objects, filterOptions) {
    log.trace('conversion to database - before filters:', objects);
    let filtered = filterObjects(objects, filterOptions, getFilterFunctionsToDatabase);
    log.trace('conversion to database - after filters:', filtered);
    return filtered;
};

/**
 * converts objects from database to "live" objects in memory that are used by the application (unencrypted)
 * @param objects the object or objects to be converted, can be a singe object or an array
 * @param filterOptions object of filter options that is passed to each filter function
 * @return object of list of objects that is/are ready for using in the application
 */
filterService.convertDatabaseToLiveObjects = function (objects, filterOptions) {
    log.trace('conversion to live - before filters:', objects);
    let filtered = filterObjects(objects, filterOptions, getFilterFunctionsFromDatabase);
    log.trace('conversion to live - after filters:', filtered);
    return filtered;
};

/**
 * update data model of given objects
 * @param objects objects with current or outdated data model, can be array or single object
 * @return {*} array or single object (depending on param objects) with updated/current data model
 */
filterService.updateDataModel = function (objects) {
    return filterObjects(objects, null, getModelConversionFunctions);
};

/**
 * filters (converts) given objects.
 *
 * @param objects the objects to filter, can be a singe object or an array
 * @param filterOptions object of filter options that is passed to each filter function
 * @param getFilterFunctionsFunction a function that returns an array of filter functions that should be used for
 *        filtering. A Filter function is a function that takes two parameters "object" and "filterOptions" and returns
 *        a filtered/converted object.
 *
 * @return {*} a list of filtered/converted objects
 */
function filterObjects(objects, filterOptions, getFilterFunctionsFunction) {
    if (!objects) {
        return objects;
    }
    let passedArray = objects instanceof Array;
    objects = passedArray ? objects : [objects];
    for (let i = 0; i < objects.length; i++) {
        let filterFunctions = getFilterFunctionsFunction(modelUtil.getModelVersionObject(objects[i].modelVersion));
        filterFunctions.forEach(filterFn => {
            objects[i] = filterFn(objects[i], filterOptions);
        });
    }
    return passedArray ? objects : objects[0];
}

/**
 * returns a list of filters that are applied before saving an object to the database.
 * @param objectModelVersion the model version of the object to filter/convert
 * @return {Array} list of filters that should be applied to the object
 */
function getFilterFunctionsToDatabase(objectModelVersion) {
    let filterFns = getModelConversionFunctions(objectModelVersion);
    filterFns.push(encryptionService.encryptObject); // encryption is last step before saving to database
    return filterFns;
}

/**
 * returns a list of filters that are applied after getting an object from database.
 * @param objectModelVersion the model version of the object to filter/convert
 * @return {Array} list of filters that should be applied to the object
 */
function getFilterFunctionsFromDatabase(objectModelVersion) {
    let filterFns = getModelConversionFunctions(objectModelVersion);
    if (objectModelVersion.major) { //before introduction of objectModel version there was no encryption, so no need of decryption
        filterFns.unshift(encryptionService.decryptObjects); //decryption is first step before other conversions
    }
    return filterFns;
}

/**
 * returns a list of filter functions that are needed to apply to convert a given object with modelVersion
 * "objectMajorModelVersion" to the latest modelVersion.
 * @param objectModelVersion the model version of the object
 * @return {Array} list of functions to be applied to bring the object to the current modelVersion
 */
function getModelConversionFunctions(objectModelVersion) {
    if (objectModelVersion.major === modelUtil.getLatestModelVersion().major) {
        return [];
    }

    let filterFns = [];
    //after adding a breaking modelVersion Change just uncomment the following switch statement and
    //insert a conversion function from major version 1 to major version 2
    //for more conversions switch fallthrough is intended - all needed conversion functions are added
    switch (objectModelVersion.major) {
        case 1:
            filterFns.push(function (object, filterOptions) { //fn from V1 to V2
                if (object.modelName === MetaData.getModelName()) {
                    log.info('converting model version from V1 to V2: ' + object.modelName);
                    let inputConfig = object.inputConfig;
                    inputConfig.dirInputs = InputConfig.DEFAULT_DIR_INPUTS;
                    inputConfig.huffInputs = InputConfig.DEFAULT_HUFF_INPUTS;
                    inputConfig.scanInputs = InputConfig.DEFAULT_SCAN_INPUTS;
                    if (inputConfig.scanKey) {
                        inputConfig.scanInputs = [];
                        inputConfig.scanInputs.push(new InputEventKey({
                            label: InputConfig.SELECT,
                            keyCode: inputConfig.scanKey,
                            keyName: inputConfig.scanKeyName
                        }));
                        inputConfig.scanEnabled = inputConfig.scanAutostart;
                        inputConfig.scanAuto = inputConfig.scanAutostart;
                        delete inputConfig.scanKey;
                        delete inputConfig.scanKeyName;
                        delete inputConfig.scanAutostart;
                        delete inputConfig.areEvents;
                        delete inputConfig.areURL;
                    }
                }
                object.modelVersion = modelUtil.getModelVersionString();
                return object;
            });
        //no break intended!
        case 2:
            filterFns.push(function (gridData, filterOptions) { //fn from V2 to V3
                if (gridData.modelName === GridData.getModelName()) {
                    log.debug('converting model version from V2 to V3: ' + gridData.modelName);
                    gridData.locale = gridData.locale || i18nService.getBrowserLang();
                    if (typeof gridData.label === 'string') {
                        let label = gridData.label;
                        gridData.label = {};
                        gridData.label[gridData.locale] = label;
                    } else {
                        gridData.label = {};
                    }
                    gridData.gridElements.forEach(element => {
                        if (typeof element.label === 'string') {
                            let label = element.label;
                            element.label = {};
                            element.label[gridData.locale] = label;
                        } else {
                            element.label = {};
                        }
                        element.actions.forEach(action => {
                            if (action.modelName === GridActionSpeakCustom.getModelName()) {
                                let text = action.speakText;
                                action.speakText = {};
                                action.speakText[gridData.locale] = text;
                                action.speakLanguage = undefined;
                            } else if (action.modelName === GridActionSpeak.getModelName()) {
                                action.speakLanguage = undefined;
                            }
                        })
                    });
                }
                gridData.modelVersion = modelUtil.getModelVersionString();
                return gridData;
            });
/*        case 3:
            filterFns.push(function (object, filterOptions) { //fn from V3 to V4
                object.modelVersion = modelUtil.getModelVersionString();
                return object
            });
 */
    }
    return filterFns;
}

export {filterService};