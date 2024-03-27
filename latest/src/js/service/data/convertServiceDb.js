import { modelUtil } from '../../util/modelUtil';
import { encryptionService } from './encryptionService';
import { log } from '../../util/log';
import { InputConfig } from '../../model/InputConfig';
import { InputEventKey } from '../../model/InputEventKey';
import { MetaData } from '../../model/MetaData';
import { GridData } from '../../model/GridData';
import { i18nService } from '../i18nService';
import { GridActionSpeakCustom } from '../../model/GridActionSpeakCustom';
import { GridActionSpeak } from '../../model/GridActionSpeak';
import { GridElement } from '../../model/GridElement.js';
import { GridElementCollect } from '../../model/GridElementCollect.js';
import { GridActionCollectElement } from '../../model/GridActionCollectElement.js';
import { GridActionPredict } from '../../model/GridActionPredict.js';
import {GridActionNavigate} from "../../model/GridActionNavigate.js";
import {VoiceConfig} from "../../model/VoiceConfig.js";
import {localStorageService} from "./localStorageService.js";

let convertServiceDb = {};

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
convertServiceDb.convertLiveToDatabaseObjects = function (objects, filterOptions) {
    log.trace('conversion to database - before filters:', objects);
    let filtered = modelUtil.convertObjects(objects, getFilterFunctionsToDatabase, filterOptions);
    log.trace('conversion to database - after filters:', filtered);
    return filtered;
};

/**
 * converts objects from database to "live" objects in memory that are used by the application (unencrypted)
 * @param objects the object or objects to be converted, can be a singe object or an array
 * @param filterOptions object of filter options that is passed to each filter function
 * @return object of list of objects that is/are ready for using in the application
 */
convertServiceDb.convertDatabaseToLiveObjects = function (objects, filterOptions) {
    log.trace('conversion to live - before filters:', objects);
    let filtered = modelUtil.convertObjects(objects, getFilterFunctionsFromDatabase, filterOptions);
    log.trace('conversion to live - after filters:', filtered);
    return filtered;
};

/**
 * update data model of given objects
 * @param objects objects with current or outdated data model, can be array or single object
 * @return {*} array or single object (depending on param objects) with updated/current data model
 */
convertServiceDb.updateDataModel = function (objects) {
    return modelUtil.convertObjects(objects, getModelConversionFunctions);
};

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
    if (objectModelVersion.major) {
        //before introduction of objectModel version there was no encryption, so no need of decryption
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
            filterFns.push(function (object, filterOptions) {
                //fn from V1 to V2
                // new structure of input configuration
                if (!object) return;
                if (object.modelName === MetaData.getModelName()) {
                    log.info('converting model version from V1 to V2: ' + object.modelName);
                    let inputConfig = object.inputConfig;
                    inputConfig.dirInputs = InputConfig.DEFAULT_DIR_INPUTS;
                    inputConfig.huffInputs = InputConfig.DEFAULT_HUFF_INPUTS;
                    inputConfig.scanInputs = InputConfig.DEFAULT_SCAN_INPUTS;
                    if (inputConfig.scanKey) {
                        inputConfig.scanInputs = [];
                        inputConfig.scanInputs.push(
                            new InputEventKey({
                                label: InputConfig.SELECT,
                                keyCode: inputConfig.scanKey,
                                keyName: inputConfig.scanKeyName
                            })
                        );
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
            filterFns.push(function (gridData, filterOptions) {
                //fn from V2 to V3
                // added translatable labels of all elements
                if (!gridData) return;
                if (gridData.modelName === GridData.getModelName()) {
                    log.debug('converting model version from V2 to V3: ' + gridData.modelName);
                    let locale = gridData.locale || i18nService.getContentLang();
                    if (typeof gridData.label === 'string') {
                        let label = gridData.label;
                        gridData.label = {};
                        gridData.label[locale] = label;
                    } else {
                        gridData.label = {};
                    }
                    gridData.gridElements.forEach((element) => {
                        if (typeof element.label === 'string') {
                            let label = element.label;
                            element.label = {};
                            element.label[locale] = label;
                        } else {
                            element.label = {};
                        }
                        element.actions.forEach((action) => {
                            if (action.modelName === GridActionSpeakCustom.getModelName()) {
                                let text = action.speakText;
                                action.speakText = {};
                                action.speakText[locale] = text;
                                action.speakLanguage = undefined;
                            } else if (action.modelName === GridActionSpeak.getModelName()) {
                                action.speakLanguage = undefined;
                            }
                        });
                    });
                }
                gridData.modelVersion = modelUtil.getModelVersionString();
                return gridData;
            });
        case 3:
            filterFns.push(function (gridData, filterOptions) {
                // fn from V3 to V4
                // new collect elements with image collecting capabilities and options
                if (!gridData) return;
                if (gridData.modelName === GridData.getModelName()) {
                    log.debug('converting model version from V3 to V4: ' + (gridData.label ? gridData.label.de : ''));
                    for (let i = 0; i < gridData.gridElements.length; i++) {
                        let gridElement = gridData.gridElements[i];
                        if (gridElement.type === GridElement.ELEMENT_TYPE_COLLECT) {
                            let collectElem = new GridElementCollect();
                            gridElement.imageHeightPercentage = gridElement.imageHeightPercentage
                                ? parseInt(gridElement.imageHeightPercentage)
                                : 85;
                            Object.assign(collectElem, gridElement);
                            collectElem.actions = [
                                new GridActionCollectElement({
                                    action: GridActionCollectElement.COLLECT_ACTION_SPEAK
                                }),
                                new GridActionPredict({
                                    suggestOnChange: true
                                })
                            ];
                            gridData.gridElements[i] = collectElem;
                        }
                    }
                }
                gridData.modelVersion = modelUtil.getModelVersionString();
                return gridData;
            });
        case 4:
            filterFns.push(function (gridData, filterOptions) {
                // fn from V4 to V5
                // new structure for GridActionNavigate actions
                if (!gridData) return;
                if (gridData.modelName === GridData.getModelName()) {
                    for (let element of gridData.gridElements) {
                        for (let action of element.actions) {
                            if (action.modelName === GridActionNavigate.getModelName() && !action.navType) {
                                action.modelVersion = modelUtil.getModelVersionString();
                                if (action.toHomeGrid) {
                                    action.navType = GridActionNavigate.NAV_TYPES.TO_HOME;
                                } else if (action.toLastGrid) {
                                    action.navType = GridActionNavigate.NAV_TYPES.TO_LAST;
                                } else {
                                    action.navType = GridActionNavigate.NAV_TYPES.TO_GRID;
                                }
                            }
                        }
                    }
                }
                gridData.modelVersion = modelUtil.getModelVersionString();
                return gridData;
            });
        case 5:
            filterFns.push(function (object, filterOptions) {
                // fn from V5 to V6
                // moved voice config from MetaData to SettingsUserLocal
                if (!object) return;
                if (object.modelName === MetaData.getModelName()) {
                    let voiceConfig = new VoiceConfig(object.localeConfig);
                    let userSettings = localStorageService.getUserSettings();
                    if (Object.keys(userSettings.voiceConfig).length === 0) {
                        userSettings.voiceConfig = voiceConfig;
                        localStorageService.saveUserSettings(userSettings);
                    }
                }
                object.modelVersion = modelUtil.getModelVersionString();
                return object;
            });
    }
    return filterFns;
}

export { convertServiceDb };
