import { GridData } from '../model/GridData.js';
import { constants } from '../util/constants.js';
import { localStorageService } from './data/localStorageService.js';
import $ from "../externals/jquery.js";
import { util } from '../util/util';

let serviceWorkerService = {};
let KEY_SHOULD_CACHE_ELEMS = 'KEY_SHOULD_CACHE_ELEMS';
const MAX_CACHE_RETRIES = 5;

let shouldCacheElements = localStorageService.getJSON(KEY_SHOULD_CACHE_ELEMS) || [];
let isCaching = false;
let _retryCounts = {};
let _messageEventListeners = [];
let _saveCacheElementsSavedAnyTime = false;

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

serviceWorkerService.addMessageEventListener = function(listener) {
    if (_messageEventListeners.includes(listener)) {
        return;
    }
    _messageEventListeners.push(listener);
};

window.serviceWorkerService = serviceWorkerService;

function init() {
    if (navigator.serviceWorker) {
        cacheNext();
        navigator.serviceWorker.addEventListener('message', (evt) => {
            for (let listener of _messageEventListeners) {
                listener(evt);
            }
            let msg = evt.data || {};
            if (msg.type === constants.SW_EVENT_ACTIVATED && msg.activated) {
                isCaching = false; // if one cache process from the old SW is stuck because of switching to new SW
                cacheNext();
                return;
            }
            if (msg.type === constants.SW_EVENT_URL_CACHED) {
                isCaching = false;
                if (msg.success) {
                    delete _retryCounts[msg.url];
                    log.warn("remove", msg.url);
                    removeCacheUrl(msg.url);
                } else { // caching failed
                    _retryCounts[msg.url] = (_retryCounts[msg.url] || 0) + 1;
                    if (_retryCounts[msg.url] <= MAX_CACHE_RETRIES) {
                        log.warn('failed to cache url: ', msg.url);
                        // move failed back in queue
                        let removed = removeCacheUrl(msg.url);
                        if (removed) {
                            addCacheElem(removed.url, removed.type);
                        }
                    } else { // give up
                        delete _retryCounts[msg.url];
                        log.warn('failed to cache url: ', msg.url, ', not trying again.');
                        removeCacheUrl(msg.url);
                    }
                }
                cacheNext();
            }
        });
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
    if (!navigator.onLine) {
        setTimeout(() => {
            log.info('caching images: not online, so waiting 15s...');
            cacheNext();
        }, 15 * 1000);
    }
    isCaching = true;

    let nextElem = shouldCacheElements[0];
    let waitTimeSeconds = 0;
    let retryCount = _retryCounts[nextElem.url] || 0;
    if (retryCount) {
        waitTimeSeconds = Math.min(5 + (2 * retryCount * retryCount), 30 * 60); // exponentially rising waiting time, max. 30 minutes about at attempt 30
        waitTimeSeconds = Math.round(waitTimeSeconds * util.getRandom(1, 1.5));
        log.info(`waiting ${waitTimeSeconds}s before caching next element, because it failed before`, nextElem.url);
    }

    setTimeout(() => {
        log.warn("caching", nextElem.url, "remaining", shouldCacheElements.length);
        if (nextElem.type === constants.SW_CACHE_TYPE_IMG) {
            $(document).trigger(constants.EVENT_GRID_IMAGES_CACHING);
        }

        postMessageInternal({
            type: constants.SW_EVENT_REQ_CACHE,
            cacheType: nextElem.type,
            url: nextElem.url
        });
    }, waitTimeSeconds * 1000);
}

function postMessageInternal(msg) {
    getController().then((controller) => {
        if (!controller) {
            return;
        }
        controller.postMessage(msg);
    });
}

async function getController() {
    if (!navigator.serviceWorker) return null;

    const registration = await navigator.serviceWorker.ready;
    return navigator.serviceWorker.controller || registration.active;
}

function addCacheElem(url = '', type) {
    url = url.trim();
    if (!url) {
        return;
    }
    if (shouldCacheElements.find(e => e.url === url)) {
        return;
    }
    shouldCacheElements.push({
        type: type,
        url: url
    });
    saveCacheElements();
}

function removeCacheUrl(url = '', save = true) {
    let removedElem = shouldCacheElements.find(e => e.url === url);
    shouldCacheElements = shouldCacheElements.filter((e) => e.url !== url);
    saveCacheElements();
    return removedElem;
}

function saveCacheElements() {
    let timeout = 5000;
    if (!_saveCacheElementsSavedAnyTime) {
        _saveCacheElementsSavedAnyTime = true;
        timeout = 0;
    }
    util.debounce(() => {
        localStorageService.saveJSON(KEY_SHOULD_CACHE_ELEMS, shouldCacheElements);
    }, timeout, 'SAVE_IMAGE_CACHE_ELEMENTS');
}

init();

export { serviceWorkerService };
