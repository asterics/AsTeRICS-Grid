importScripts('app/lib/workbox-sw.js');
importScripts('serviceWorkerCachePaths.js');

let constants = {};
constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE = 'SW_EVENT_REQ_CACHE';
constants.SW_MATRIX_REQ_DATA = 'SW_MATRIX_REQ_DATA';
constants.SW_CACHE_TYPE_IMG = 'CACHE_TYPE_IMG';
constants.SW_CACHE_TYPE_GENERIC = 'CACHE_TYPE_GENERIC';

if (!workbox) {
    console.log("Workbox in service worker failed to load!");
}
self.__WB_DISABLE_DEV_LOGS = true;
/*workbox.setConfig({
    debug: true
});*/

self.addEventListener('install', (event) => {
    console.log('installing service worker ...');
    let urls = self.URLS_TO_CACHE;
    const cacheName = workbox.core.cacheNames.runtime;
    let promise = caches.delete(cacheName).then(() => {
        return caches.open(cacheName);
    }).then((cache) => {
        return Promise.all(
            urls.map(function (url) {
                return cache.add(url).catch(function (reason) {
                    console.warn(`failed to fetch "${url}" in Service Worker.`);
                    console.warn(reason);
                    return Promise.resolve();
                });
            })
        );
    });
    event.waitUntil(promise);
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    clients.claim();
    sendToClients({type: constants.SW_EVENT_ACTIVATED, activated: true});
    console.log('Service Worker active! Version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
});

self.addEventListener('message', (event) => {
    let msg = event.data;
    if(!msg || msg.type !== constants.SW_EVENT_REQ_CACHE || !msg.url) {
        return;
    }
    let cacheName = msg.cacheType === constants.SW_CACHE_TYPE_IMG ? 'image-cache' : workbox.core.cacheNames.runtime;

    caches.open(cacheName).then(async (cache) => {
        let responseCode = await getResponseCode(cache, msg.url);
        let response = null;
        if (responseCode !== 200) {
            //console.debug(`adding ${msg.url} to cache "${cacheName}".`);
            response = await tryFetchImage(msg.url);
            if (!response) {
                console.log('error fetching image, trying with no-cors');
                response = await tryFetchImage(msg.url, 'no-cors');
            }
            if (!response) {
                // probably real network error - both normal fetch and cors-fetch didn't succeed at all
                responseCode = -1;
            } else {
                // if opaque response existing - assuming it succeeded (200) - cannot really check
                // otherwise use real response status
                responseCode = response.type === 'opaque' ? 200 : response.status;
            }
        }
        if (response && responseCode === 200) {
            await cache.put(msg.url, response);
        }
        sendToClients({type: constants.SW_EVENT_URL_CACHED, url: msg.url, success: responseCode === 200, responseCode: responseCode});
    });
});

workbox.routing.registerRoute(({url, request, event}) => {
    //console.debug(`${url.href} should cache normal: ${shouldCacheNormal(url, request)}`);
    return shouldCacheNormal(url, request);
}, new workbox.strategies.CacheFirst());

workbox.routing.registerRoute(({url, request, event}) => {
    //console.debug(`${url.href} should cache normal: ${shouldCacheNormal(url, request)}`);
    return shouldCacheStaleWhileRevalidate(url, request);
}, new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'stale-while-revalidate-cache'
}));

workbox.routing.registerRoute(({url, request, event}) => {
    //console.debug(`${url.href} should cache image: ${shouldCacheImage(url, request)}`);
    return shouldCacheImage(url, request);
}, new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    fetchOptions: {
        mode: 'cors',
        credentials: 'omit'
    }
}));

async function tryFetchImage(url, fetchMode = undefined) {
    let response = null;
    try {
        response = await fetch(url, { mode: fetchMode });
    } catch (e) {
        console.log('error fetching image', e.message);
    }
    return response;
}

function shouldCacheImage(url, request) {
    let isOwnHost = url.hostname === 'grid.asterics.eu';
    let isImageRequest = request.destination === 'image';
    return !isOwnHost && isImageRequest && !shouldCacheStaleWhileRevalidate(url);
}

function shouldCacheStaleWhileRevalidate(url, request) {
    return url.href.startsWith('https://asterics.github.io/AsTeRICS-Grid-Boards');
}

function shouldCacheNormal(url, request) {
    let isOwnHost = url.hostname === 'grid.asterics.eu';
    return isOwnHost && !shouldCacheImage(url, request) && !shouldCacheStaleWhileRevalidate(url);
}

async function getResponseCode(cache, url) {
    let response = await cache.match(url);
    return response ? response.status : -1;
}

function sendToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}