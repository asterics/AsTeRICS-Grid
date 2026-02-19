import { GridData } from '../model/GridData.js';
import { constants } from '../util/constants.js';
import { localStorageService } from './data/localStorageService.js';
import $ from "../externals/jquery.js";
import { util } from '../util/util';
import { MainVue } from '../vue/mainVue';
import { i18nService } from './i18nService';

let serviceWorkerService = {};
let KEY_SHOULD_CACHE_ELEMS = 'KEY_SHOULD_CACHE_ELEMS';
const MAX_CACHE_RETRIES = 5;
const MAX_CONCURRENT_REQUESTS = 10;

let shouldCacheElements = localStorageService.getJSON(KEY_SHOULD_CACHE_ELEMS) || [];
let _retryCounts = {};
let _messageEventListeners = [];
let _tooltipInfos = null;
let _countTodo = 0;
let _countDone = 0;
let _processingUrls = new Set(); // urls that are currently processed
let _hasCachedImages = false;

serviceWorkerService.cacheUrl = function (url) {
    if (!constants.SUPPORTS_SERVICE_WORKER) {
        return;
    }
    addCacheElem(url, constants.SW_CACHE_TYPE_GENERIC);
    cacheNext();
};

/**
 * caches all images contained in an array of grids in the serviceWorker
 * @param array array of grids, can also contain other documents from couchDB/pouchDB
 */
serviceWorkerService.cacheImagesOfGrids = function (array) {
    if (!constants.SUPPORTS_SERVICE_WORKER) {
        return;
    }
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
    saveCacheElements(true);
    resetNotifyTooltip();
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
            if (msg.type === constants.SW_CONSOLE) {
                console[msg.method]('[SW]', ...msg.args);
                return;
            }
            if (msg.type === constants.SW_EVENT_ACTIVATED && msg.activated) {
                cacheNext();
                return;
            }
            if (msg.type === constants.SW_EVENT_URL_CACHED) {
                _processingUrls.delete(msg.url);

                if (msg.success) {
                    delete _retryCounts[msg.url];
                    let removed = removeCacheUrl(msg.url);
                    if (removed) {
                        _countDone++;
                    }
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
    if (!constants.SUPPORTS_SERVICE_WORKER) {
        return;
    }
    if (!constants.IS_ENVIRONMENT_PROD && !constants.FORCE_USE_SW) {
        return;
    }
    if (shouldCacheElements.length === 0 && _processingUrls.size === 0) {
        log.info('caching files via service worker finished.');
        if (_hasCachedImages) {
            _notifyCachingImageProgress();
            $(document).trigger(constants.EVENT_GRID_IMAGES_CACHED);
            setTimeout(() => {
                resetNotifyTooltip();
            }, 1000);
        }
        _hasCachedImages = false;
        return;
    }
    if (!navigator.onLine) {
        log.info('caching images: not online, so waiting 15s...');
        return setTimeout(() => {
            cacheNext();
        }, 15 * 1000);
    }

    const batch = shouldCacheElements
        .filter(elem => !_processingUrls.has(elem.url))
        .slice(0, MAX_CONCURRENT_REQUESTS - _processingUrls.size);

    if (batch.length === 0) return;
    batch.forEach(item => _processingUrls.add(item.url));
    let retryCountNumbers = batch.map(item => _retryCounts[item.url] || 0);
    let maxRetryCount = Math.max(0, ...retryCountNumbers);

    let waitTimeSeconds = 0;
    if (maxRetryCount) {
        waitTimeSeconds = Math.min(5 + (2 * maxRetryCount * maxRetryCount), 30 * 60); // exponentially rising waiting time, max. 30 minutes about at attempt 30
        waitTimeSeconds = Math.round(waitTimeSeconds * util.getRandom(1, 1.5));
        log.info(`waiting ${waitTimeSeconds}s before caching next element, because some failed before`);
    }

    setTimeout(() => {
        if (batch.some(item => item.type === constants.SW_CACHE_TYPE_IMG)) {
            _hasCachedImages = true;
            $(document).trigger(constants.EVENT_GRID_IMAGES_CACHING);
            _notifyCachingImageProgress();
        }

        postMessageInternal({
            type: constants.SW_EVENT_REQ_CACHE_BATCH,
            items: batch
        });
    }, waitTimeSeconds * 1000);
}

function _notifyCachingImageProgress() {
    if (!_hasCachedImages) {
        return;
    }
    _countTodo = _countTodo || shouldCacheElements.length;
    let percent = Math.min(100, Math.ceil((_countDone / _countTodo) * 100));
    let text = i18nService.t('downloadingImagesWithPercent', percent);
    if (!_tooltipInfos) {
        _tooltipInfos = MainVue.setTooltip(text, {
            closeOnNavigate: false,
            msgType: 'info'
        });
    } else {
        _tooltipInfos.htmlUpdateFn(_tooltipInfos.id, text);
    }
}

function resetNotifyTooltip() {
    if (_tooltipInfos) {
        MainVue.clearTooltip(_tooltipInfos.id);
    }
    _tooltipInfos = null;
    _countDone = 0;
    _countTodo = 0;
}

function postMessageInternal(msg) {
    getController().then((controller) => {
        if (!controller) {
            console.warn("could not set message to SW - no controller!")
            return;
        }
        controller.postMessage(msg);
    });
}

async function getController() {
    if (!navigator.serviceWorker) return null;

    await navigator.serviceWorker.ready;  // Wait for activation

    // check if it's controlling our page
    if (navigator.serviceWorker.controller) {
        return navigator.serviceWorker.controller;
    }

    // If not, wait for controllerchange
    return new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            resolve(navigator.serviceWorker.controller);
        }, { once: true });
    });
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

function removeCacheUrl(url = '') {
    let removedElem = shouldCacheElements.find(e => e.url === url);
    shouldCacheElements = shouldCacheElements.filter((e) => e.url !== url);
    saveCacheElements();
    return removedElem;
}

function saveCacheElements(forceSave = false) {
    let minPause = forceSave || shouldCacheElements.length === 0 ? 0 : 2000;
    util.throttle(() => {
        localStorageService.saveJSON(KEY_SHOULD_CACHE_ELEMS, shouldCacheElements);
    }, null, minPause, 'SAVE_IMAGE_CACHE_ELEMENTS');
}

init();

export { serviceWorkerService };
