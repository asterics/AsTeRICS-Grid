import { GridData } from '../model/GridData.js';
import { constants } from '../util/constants.js';
import { localStorageService } from './data/localStorageService.js';
import $ from "../externals/jquery.js";
import { util } from '../util/util';

let serviceWorkerService = {};
let KEY_SHOULD_CACHE_ELEMS = 'KEY_SHOULD_CACHE_ELEMS';

let shouldCacheElements = localStorageService.getJSON(KEY_SHOULD_CACHE_ELEMS) || [];
let isCaching = false;
let _retryCount = 0;

serviceWorkerService.cacheUrl = function (url) {
    addCacheElem(url, constants.SW_CACHE_TYPE_GENERIC);
    cacheNext();
};

/**
 * caches all images contained in an array of grids in the serviceWorker
 * @param array array of grids, can also contain other documents from couchDB/pouchDB
 */
serviceWorkerService.cacheImagesOfGrids = function (array) {
    array = array || [];
    for (let doc of array) {
        if (doc.modelName === GridData.getModelName()) {
            for (let element of doc.gridElements) {
                if (element.image && element.image.url) {
                    addCacheElem(element.image.url, constants.SW_CACHE_TYPE_IMG);
                }
            }
        }
    }
    log.info('caching', shouldCacheElements.length, 'grid images...');
    cacheNext();
};

window.serviceWorkerService = serviceWorkerService;

function init() {
    if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener('message', (evt) => {
            let msg = evt.data;
            if (msg.type === constants.SW_EVENT_URL_CACHED) {
                isCaching = false;
                if (msg.success || msg.responseCode === 404 || msg.responseCode === 403) { // assuming 404 and 403 is permanently, so also remove
                    if (msg.responseCode === 404) {
                        log.warn('failed to cache url with status: ', msg.responseCode, msg.url, ', not trying again.');
                    }
                    _retryCount = 0;
                    removeCacheUrl(msg.url);
                    cacheNext();
                } else { // assuming temporary network error, so retry
                    let waitTimeSeconds = Math.min(5 + (2 * _retryCount * _retryCount), 30 * 60); // exponentially rising waiting time, max. 30 minutes about at attempt 30
                    waitTimeSeconds = Math.round(waitTimeSeconds * util.getRandom(1, 1.5));
                    log.warn("failed to cache url: ", msg.url, msg.responseCode, ", next try in seconds: ", waitTimeSeconds);
                    _retryCount++;
                    util.shuffleArray(shouldCacheElements); // prevent trying permanently failing element over and over again
                    setTimeout(() => {
                        cacheNext();
                    }, waitTimeSeconds * 1000);
                }
            }
        });

        cacheNext();
    }
}

function cacheNext() {
    if (shouldCacheElements.length === 0) {
        log.info('caching files via service worker finished.');
        $(document).trigger(constants.EVENT_GRID_IMAGES_CACHED);
        return;
    }
    if (isCaching) {
        return;
    }
    isCaching = true;
    shouldCacheElements = shouldCacheElements.filter((e) => !!e.url);
    if (shouldCacheElements[0].type === constants.SW_CACHE_TYPE_IMG) {
        $(document).trigger(constants.EVENT_GRID_IMAGES_CACHING);
    }
    postMessageInternal({
        type: constants.SW_EVENT_REQ_CACHE,
        cacheType: shouldCacheElements[0].type,
        url: shouldCacheElements[0].url
    });
}

function postMessageInternal(msg) {
    getController().then((controller) => {
        if (!controller) {
            return;
        }
        controller.postMessage(msg);
    });
}

function getController() {
    if (!navigator.serviceWorker) {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        if (navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === 'activated') {
            resolve(navigator.serviceWorker.controller);
        } else {
            navigator.serviceWorker.addEventListener('message', (evt) => {
                if (evt.data && evt.data.activated) {
                    resolve(navigator.serviceWorker.controller);
                }
            });
        }
    });
}

function addCacheElem(url, type) {
    let existingUrls = shouldCacheElements.map((e) => e.url);
    if (existingUrls.includes(url)) {
        return;
    }
    shouldCacheElements.push({
        type: type,
        url: url
    });
    localStorageService.saveJSON(KEY_SHOULD_CACHE_ELEMS, shouldCacheElements);
}

function removeCacheUrl(url) {
    shouldCacheElements = shouldCacheElements.filter((e) => e.url !== url);
    localStorageService.saveJSON(KEY_SHOULD_CACHE_ELEMS, shouldCacheElements);
}

init();

export { serviceWorkerService };
