import Vue from 'vue';
import { MetaData } from '../../../model/MetaData';
import { modelUtil } from '../../../util/modelUtil';
import { localStorageService } from '../localStorageService';
import $ from '../../../externals/jquery';
import { constants } from '../../../util/constants';
import { databaseService } from '../databaseService';

let metadataStore = {};
const PROP_ID = "id";

metadataStore.state = Vue.observable(new MetaData());

let _isVirtual = true;
let _pendingPatch = {};
let _pendingPatchKeys = new Set();
let _dbVersionMetadata = null;

/**
 * Handover from the database.
 */
metadataStore.initMetadata = async function(newMetadata) {
    _dbVersionMetadata = JSON.parse(JSON.stringify(newMetadata));
    newMetadata = JSON.parse(JSON.stringify(newMetadata));
    let save = false;
    if (_isVirtual) {
        // Merge session edits
        if (_pendingPatchKeys.size > 0) {
            Object.assign(newMetadata, _pendingPatch);
            _pendingPatch = {};
            _pendingPatchKeys = new Set();
            save = true;
        }
    }

    // adapt with local-only values
    if (!localStorageService.getAppSettings().syncNavigation) {
        let localMetadata = localStorageService.getUserSettings().metadata;
        if (localMetadata) {
            newMetadata.locked = localMetadata.locked;
            newMetadata.fullscreen = localMetadata.fullscreen;
            newMetadata.lastOpenedGridId = localMetadata.lastOpenedGridId;
        }
    }

    Object.assign(metadataStore.state, newMetadata);
    _isVirtual = false;
    if (save) {
        await metadataStore.save();
    }
};

metadataStore.getReadOnly = function () {
    return JSON.parse(JSON.stringify(metadataStore.state));
};

metadataStore.save = async function() {
    if (_isVirtual) {
        return;
    }

    let currentValue = metadataStore.getReadOnly();
    localStorageService.saveUserSettings({ metadata: currentValue });

    if (!localStorageService.getAppSettings().syncNavigation) {
        currentValue.locked = _dbVersionMetadata.locked;
        currentValue.fullscreen = _dbVersionMetadata.fullscreen;
        currentValue.lastOpenedGridId = _dbVersionMetadata.lastOpenedGridId;
    }

    if (modelUtil.isEqual(currentValue, _dbVersionMetadata)) {
        return;
    }

    await databaseService.saveObject(MetaData, currentValue);
    $(document).trigger(constants.EVENT_METADATA_UPDATED, currentValue);
    _dbVersionMetadata = currentValue;
};

metadataStore.reset = function() {
    metadataStore.state = Vue.observable(new MetaData());
    _isVirtual = true;
    _pendingPatch = {};
    _pendingPatchKeys = new Set();
    _dbVersionMetadata = null;
}

/**
 * watches for changes of the state and keeps track which changes
 * where made in "virtual" state, so when we do not have the actual
 * metadata object
 */
function initWatcher() {
    new Vue().$watch(
        () => metadataStore.state,
        (newVal) => {
            if (_isVirtual) {
                const defaults = new MetaData();
                for (const key of Object.keys(newVal)) {
                    // detect what really changed and save it to _pendingPatch
                    if (key !== PROP_ID) {
                        const newValStr = JSON.stringify(newVal[key]);
                        const compareVal = _pendingPatchKeys.has(key) ? _pendingPatch[key] : defaults[key];
                        const compareValStr = JSON.stringify(compareVal);

                        if (newValStr !== compareValStr) {
                            _pendingPatch[key] = newVal[key] === undefined ? undefined : JSON.parse(newValStr);
                            _pendingPatchKeys.add(key);
                        }
                    }
                }
            }
        },
        { deep: true }
    );
}
initWatcher();

$(document).on(constants.EVENT_USER_CHANGED, metadataStore.reset);

export { metadataStore };