importScripts('app/lib/workbox-sw.js');
importScripts('serviceWorkerCachePaths.js');

let constants = {};
constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE = 'SW_EVENT_REQ_CACHE';
constants.SW_MATRIX_REQ_DATA = 'SW_MATRIX_REQ_DATA';
constants.SW_CACHE_TYPE_IMG = 'CACHE_TYPE_IMG';
constants.SW_CACHE_TYPE_GENERIC = 'CACHE_TYPE_GENERIC';
constants.KNOWN_IMAGE_APIS = ['https://api.arasaac.org', 'https://d18vdu4p71yql0.cloudfront.net'];

if (!workbox) {
    console.log('Workbox in service worker failed to load!');
}
self.__WB_DISABLE_DEV_LOGS = true;
/*workbox.setConfig({
    debug: true
});*/

const strategyNormalCacheFirst = new workbox.strategies.CacheFirst();

const strategyImageCacheFirstCors = new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    fetchOptions: {
        mode: 'cors'
    }
});

const strategyImageCacheFirstNoCors = new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    fetchOptions: {
        mode: 'no-cors'
    }
});

const dynamicImageHandler = async ({ url, request, event }) => {
    try {
        // First Attempt: Try CORS
        // use the CORS strategy. If the server doesn't support CORS, this throws.
        return await strategyImageCacheFirstCors.handle({ url, request, event });
    } catch (error) {
        // Second Attempt: Fallback to No-CORS
        // This creates an "opaque" response (you can't read the pixels in JS,
        // but the <img> tag can still display it).
        console.info(`CORS fetch failed for ${url.href}, falling back to no-cors.`);
        return await strategyImageCacheFirstNoCors.handle({ url, request, event });
    }
};

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheNormal(url, request);
}, strategyNormalCacheFirst);

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheStaleWhileRevalidate(url, request);
}, new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'stale-while-revalidate-cache'
}));

workbox.routing.registerRoute(({ url, request, event }) => {
    return shouldCacheImage(url, request);
}, dynamicImageHandler);

self.addEventListener('install', (event) => {
    console.log('installing service worker ...');
    let urls = self.URLS_TO_CACHE;
    const cacheName = workbox.core.cacheNames.runtime;
    let promise = caches.delete(cacheName).then(() => {
        return caches.open(cacheName);
    }).then((cache) => {
        return Promise.all(
            urls.map(function(url) {
                return cache.add(url).catch(function(reason) {
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
    event.waitUntil((async () => {
        await clients.claim();
        await sendToClients({
            type: constants.SW_EVENT_ACTIVATED,
            activated: true
        });

        console.log('Service Worker active! Version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
    })());
});

self.addEventListener('message', async (event) => {
    let msg = event.data;
    if (!msg || msg.type !== constants.SW_EVENT_REQ_CACHE || !msg.url) {
        return;
    }
    
    try {
        let response;
        if (msg.cacheType === constants.SW_CACHE_TYPE_IMG) {
            try {
                response = await strategyImageCacheFirstCors.handle({ request: new Request(msg.url, { mode: 'cors' }) });
            } catch (e) {
                response = await strategyImageCacheFirstNoCors.handle({ request: new Request(msg.url, { mode: 'no-cors' }) });
            }
        } else {
            response = await strategyNormalCacheFirst.handle({ request: new Request(msg.url) });
        }

        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: msg.url,
            success: !!response
        });

    } catch (e) {
        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: msg.url,
            success: false
        });
    }
});

function isKnownImageAPI(url) {
    url = url.href ? url.href : url; // use full URL
    return constants.KNOWN_IMAGE_APIS.some(apiUrl => url.startsWith(apiUrl));
}

function shouldCacheImage(url, request) {
    const isOwnHost = url.hostname === self.location.hostname;
    const isImageExtension = /\.(png|jpg|jpeg|gif|webp|svg|bmp)(\?.*)?$/i.test(url.href);
    const isImageDestination = request.destination === 'image';
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