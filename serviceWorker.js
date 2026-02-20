importScripts(
    'app/lib/workbox/workbox-v7.4.0/workbox-core.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-strategies.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-routing.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-precaching.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-cacheable-response.prod.js'
);
/*importScripts(
    'https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js'
);*/
importScripts('serviceWorkerCachePaths.js');

let constants = {};
constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE_BATCH = 'SW_EVENT_REQ_CACHE_BATCH';
constants.SW_MATRIX_REQ_DATA = 'SW_MATRIX_REQ_DATA';
constants.SW_CACHE_TYPE_IMG = 'CACHE_TYPE_IMG';
constants.SW_CACHE_TYPE_GENERIC = 'CACHE_TYPE_GENERIC';
constants.SW_CONSOLE = 'SW_CONSOLE';
constants.ENABLE_REMOTE_DEBUGGING = false;
constants.KNOWN_IMAGE_APIS = ['https://api.arasaac.org', 'https://d18vdu4p71yql0.cloudfront.net'];

let imageCachePromise = null;

if (!workbox) {
    console.log('Workbox in service worker failed to load!');
}
self.__WB_DISABLE_DEV_LOGS = true;
/*workbox.setConfig({
    debug: true
});*/

if (self.URLS_TO_CACHE && self.URLS_TO_CACHE.length > 0) {
    // map the strings to the format Workbox expects: { url: '...', revision: '...' }
    // Since we don't have a build tool generating hashes use the version constant
    const precacheManifest = self.URLS_TO_CACHE.map(url => ({
        url: url,
        revision: '#ASTERICS_GRID_VERSION#'
    }));

    workbox.precaching.precacheAndRoute(precacheManifest);
}

// cache normal 200 and 304 not modified (if something is already in browser cache)
const cacheablePlugin = new workbox.cacheableResponse.CacheableResponsePlugin({
    statuses: [200, 304]
});

const strategyNormalCacheFirst = new workbox.strategies.CacheFirst({
    cacheName: 'app-cache',
    plugins: [cacheablePlugin]
});

const dynamicImageHandler = async ({ url, request }) => {
    const cache = await getImageCache();
    const cached = await cache.match(url.href);
    if (cached) {
        return cached;
    }

    // Fetch from network
    let response;
    try {
        response = await fetch(request);
    } catch (e) {
        console.warn('[SW] fetch image failed:', e);
        throw e;
    }

    // Cache successful responses
    if (response.status === 200 || response.status === 304 || response.type === 'opaque') {
        let responseToCache = response.clone();
        await cache.put(url.href, responseToCache);
    }
    return response;
};

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheNormal(url, request);
}, strategyNormalCacheFirst);

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheStaleWhileRevalidate(url, request);
}, new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'stale-while-revalidate-cache',
    plugins: [cacheablePlugin]
}));

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheImage(url, request);
}, dynamicImageHandler);

self.addEventListener('install', (event) => {
    console.log('installing service worker ...');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        await clients.claim();
        await sendToClients({
            type: constants.SW_EVENT_ACTIVATED,
            activated: true
        });

        console.log('Service Worker active! Version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
    })());
});

self.addEventListener('message', (event) => {
    let msg = event.data || {};
    if (!msg.type) {
        return;
    }
    if (msg.type === constants.SW_EVENT_REQ_CACHE_BATCH && msg.items && msg.items.length) {
        const cachePromise = processCacheBatch(msg.items, event);
        try {
            event.waitUntil(cachePromise);
        } catch (e) {
            console.warn('[SW] waitUntil failed (Firefox iOS?), processing anyway:', e.message);
            // The promise will still execute, we just can't prevent SW termination
            // This is OK for Firefox iOS because it seems to keep SW alive differently
        }
    }
});

async function processCacheBatch(items, event) {
    for (let item of items) {
        try {
            await cacheOneItem(item, event);
        } catch (e) {
            sendToClients({
                type: constants.SW_EVENT_URL_CACHED,
                url: item.url,
                success: false
            });
        }
    }
}

async function cacheOneItem(item, event) {
    try {
        let response;
        if (item.type === constants.SW_CACHE_TYPE_IMG) {
            response = await dynamicImageHandler({
                url: new URL(item.url),
                request: new Request(item.url),
                event: event
            });
        } else {
            response = await strategyNormalCacheFirst.handle({
                request: new Request(item.url),
                event: event
            });
        }

        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: item.url,
            success: !!response
        });

    } catch (e) {
        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: item.url,
            success: false
        });
    }
}

function isKnownImageAPI(url) {
    url = url.href ? url.href : url; // use full URL
    return constants.KNOWN_IMAGE_APIS.some(apiUrl => url.startsWith(apiUrl));
}

function shouldCacheImage(url, request) {
    const isOwnHost = url.hostname === self.location.hostname;
    const isImageExtension = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(url.href);
    const isImageDestination = request && request.destination === 'image';
    const isKnownAPI = isKnownImageAPI(url);

    return !isOwnHost &&
        (isImageExtension || isImageDestination || isKnownAPI) &&
        !shouldCacheStaleWhileRevalidate(url);
}

function shouldCacheStaleWhileRevalidate(url, request) {
    return url.href.startsWith('https://asterics.github.io/AsTeRICS-Grid-Boards');
}

function shouldCacheNormal(url, request) {
    let isOwnHost = url.hostname === self.location.hostname;
    return isOwnHost && !shouldCacheImage(url, request) && !shouldCacheStaleWhileRevalidate(url);
}

function sendToClients(msg) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage(msg));
    });
}

function getImageCache() {
    if (!imageCachePromise) {
        imageCachePromise = caches.open('image-cache');
    }
    return imageCachePromise;
}

// forward logs to page
if (constants.ENABLE_REMOTE_DEBUGGING) {
    (function() {
        const methods = ['log', 'info', 'warn', 'error', 'debug'];

        methods.forEach(method => {
            const original = console[method];

            console[method] = function(...args) {
                // Send to all clients
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: constants.SW_CONSOLE,
                            method,
                            args
                        });
                    });
                });

                // Keep default behavior
                original.apply(console, args);
            };
        });
    })();
}
