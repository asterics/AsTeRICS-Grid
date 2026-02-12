importScripts(
    'app/lib/workbox/workbox-v7.4.0/workbox-core.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-strategies.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-routing.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-precaching.prod.js',
    'app/lib/workbox/workbox-v7.4.0/workbox-cacheable-response.prod.js'
);
importScripts('serviceWorkerCachePaths.js');

let constants = {};
constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE_BATCH = 'SW_EVENT_REQ_CACHE_BATCH';
constants.SW_EVENT_SKIP_WAITING = 'SW_EVENT_SKIP_WAITING';
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

const strategyImageCacheFirstCors = new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    fetchOptions: {
        mode: 'cors',
        credentials: 'omit'
    },
    plugins: [cacheablePlugin]
});

const strategyImageCacheFirstNoCors = new workbox.strategies.CacheFirst({
    cacheName: 'image-cache',
    fetchOptions: {
        mode: 'no-cors'
    },
    plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200] // Explicitly allow Status 0 (Opaque) and 200
        })
    ]
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
        try {
            return await strategyImageCacheFirstNoCors.handle({ url, request, event });
        } catch {
            // Third attempt: try to get result event if headers or search are not matching
            const cache = await caches.open('image-cache');
            const cachedResponse = await cache.match(request.url, {
                ignoreSearch: true, // matches even if query strings differ
                ignoreVary: true // ignore mismatch of headers
            });
            if (cachedResponse) {
                // Even if the URL matches, we check the 'type'.
                // If the client needs CORS but the cache is a 'black box' (opaque),
                // we MUST ignore the cache and try a fresh fetch.
                if (request.mode === 'cors' && cachedResponse.type === 'opaque') {
                    console.debug('Cached version is opaque but CORS is required. Fetching fresh...');
                } else {
                    return cachedResponse;
                }
            }
        }
    }
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

    // LEGACY SUPPORT: Trigger the "Old UI" update notification
    // We send the 'activated' message even though we are just 'installed'
    // so the old UI code shows the tooltip.
    // self.skipWaiting(); // Temporary: keep this for ONE release to force the swap
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
    let msg = event.data || {};
    if (!msg.type) {
        return;
    }
    if (msg.type === constants.SW_EVENT_SKIP_WAITING) {
        self.skipWaiting();
    } else if (msg.type === constants.SW_EVENT_REQ_CACHE_BATCH && msg.items && msg.items.length) {
        for (let item of msg.items) {
            cacheOneItem(item, event);
        }
    }
});

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