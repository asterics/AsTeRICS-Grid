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
constants.SW_CONSOLE = 'SW_CONSOLE';
constants.ENABLE_REMOTE_DEBUGGING = false;
constants.KNOWN_IMAGE_APIS = ['https://api.arasaac.org', 'https://d18vdu4p71yql0.cloudfront.net'];

let imageCachePromise = null;
const inFlightCacheRequests = new Set();

// ===== DIAGNOSTIC: Browser Detection =====
const isFirefoxIOS = /FxiOS/i.test(navigator.userAgent);
console.log('═══════════════════════════════════════════════════════');
console.log('[SW INIT] Service Worker Starting');
console.log('[SW INIT] Browser:', {
    userAgent: navigator.userAgent,
    isFirefoxIOS: isFirefoxIOS
});
console.log('[SW INIT] Workbox loaded:', !!self.workbox);
console.log('[SW INIT] Cache API available:', !!self.caches);
console.log('═══════════════════════════════════════════════════════');

if (!workbox) {
    console.error('[SW INIT] ✗ Workbox in service worker FAILED to load!');
} else {
    console.log('[SW INIT] ✓ Workbox loaded successfully');
    console.log('[SW INIT] Workbox modules:', {
        core: !!workbox.core,
        strategies: !!workbox.strategies,
        routing: !!workbox.routing,
        precaching: !!workbox.precaching,
        cacheableResponse: !!workbox.cacheableResponse
    });
}

self.__WB_DISABLE_DEV_LOGS = true;

if (self.URLS_TO_CACHE && self.URLS_TO_CACHE.length > 0) {
    console.log('[SW INIT] Precaching', self.URLS_TO_CACHE.length, 'URLs');
    const precacheManifest = self.URLS_TO_CACHE.map(url => ({
        url: url,
        revision: '#ASTERICS_GRID_VERSION#'
    }));
    workbox.precaching.precacheAndRoute(precacheManifest);
} else {
    console.log('[SW INIT] No URLs to precache');
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

console.log('[SW INIT] Strategies configured');

const dynamicImageHandler = async ({ url, request, event }) => {
    console.log('───────────────────────────────────────────────────────');
    console.log('[SW dynamicImageHandler] START');
    console.log('[SW dynamicImageHandler] URL:', url.href);
    console.log('[SW dynamicImageHandler] Request:', {
        mode: request.mode,
        destination: request.destination,
        method: request.method
    });
    console.log('[SW dynamicImageHandler] In-flight?', inFlightCacheRequests.has(url.href));

    if (!inFlightCacheRequests.has(url.href)) {
        console.log('[SW dynamicImageHandler] Checking cache...');
        const cache = await getImageCache();

        // Try exact match first
        let cachedResponse = await cache.match(request.url);
        if (cachedResponse) {
            console.log('[SW dynamicImageHandler] ✓ Cache HIT (exact match):', {
                type: cachedResponse.type,
                status: cachedResponse.status,
                ok: cachedResponse.ok
            });
        } else {
            console.log('[SW dynamicImageHandler] Cache MISS (exact), trying fuzzy match...');

            // Try fuzzy match
            cachedResponse = await cache.match(request.url, {
                ignoreSearch: true,
                ignoreVary: true
            });

            if (cachedResponse) {
                console.log('[SW dynamicImageHandler] ✓ Cache HIT (fuzzy match):', {
                    type: cachedResponse.type,
                    status: cachedResponse.status
                });
            } else {
                console.log('[SW dynamicImageHandler] ✗ Cache MISS (both attempts)');
            }
        }

        if (cachedResponse) {
            // Check CORS compatibility
            if (request.mode === 'cors' && cachedResponse.type === 'opaque') {
                console.warn('[SW dynamicImageHandler] ⚠ Cached response is opaque but CORS required');
                console.warn('[SW dynamicImageHandler] Ignoring cache, will fetch fresh');
            } else {
                console.log('[SW dynamicImageHandler] ✓ Returning cached response');
                console.log('───────────────────────────────────────────────────────');
                return cachedResponse;
            }
        }
    } else {
        console.log('[SW dynamicImageHandler] URL is in-flight, skipping cache check');
    }

    // Network fetch
    console.log('[SW dynamicImageHandler] Proceeding to network fetch...');

    try {
        console.log('[SW dynamicImageHandler] Attempt 1: CORS strategy');
        const corsStart = Date.now();
        const response = await strategyImageCacheFirstCors.handle({ url, request, event });
        const corsDuration = Date.now() - corsStart;

        console.log('[SW dynamicImageHandler] ✓ CORS strategy SUCCESS in', corsDuration, 'ms');
        console.log('[SW dynamicImageHandler] Response:', {
            hasResponse: !!response,
            type: response?.type,
            status: response?.status,
            ok: response?.ok
        });
        console.log('───────────────────────────────────────────────────────');
        return response;
    } catch (error) {
        console.warn('[SW dynamicImageHandler] ✗ CORS strategy FAILED:', {
            name: error.name,
            message: error.message
        });
        console.log('[SW dynamicImageHandler] Attempt 2: No-CORS strategy');

        try {
            const noCorsStart = Date.now();
            const response = await strategyImageCacheFirstNoCors.handle({ url, request, event });
            const noCorsDuration = Date.now() - noCorsStart;

            console.log('[SW dynamicImageHandler] ✓ No-CORS strategy SUCCESS in', noCorsDuration, 'ms');
            console.log('[SW dynamicImageHandler] Response:', {
                hasResponse: !!response,
                type: response?.type,
                status: response?.status
            });
            console.log('───────────────────────────────────────────────────────');
            return response;
        } catch (noCorsError) {
            console.error('[SW dynamicImageHandler] ✗ No-CORS strategy FAILED:', {
                name: noCorsError.name,
                message: noCorsError.message,
                stack: noCorsError.stack
            });
            console.log('───────────────────────────────────────────────────────');
            throw noCorsError;
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

console.log('[SW INIT] Routes registered');

self.addEventListener('install', (event) => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW install] Installing service worker...');
    console.log('═══════════════════════════════════════════════════════');
});

self.addEventListener('activate', event => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW activate] Starting activation...');

    event.waitUntil((async () => {
        console.log('[SW activate] Claiming clients...');
        await clients.claim();
        console.log('[SW activate] ✓ Clients claimed');

        console.log('[SW activate] Sending activation message...');
        await sendToClients({
            type: constants.SW_EVENT_ACTIVATED,
            activated: true
        });
        console.log('[SW activate] ✓ Activation message sent');

        console.log('[SW activate] ✓ Service Worker ACTIVE!');
        console.log('[SW activate] Version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#');
        console.log('═══════════════════════════════════════════════════════');
    })());
});

self.addEventListener('message', (event) => {
    let msg = event.data || {};

    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW message] Message received');
    console.log('[SW message] Type:', msg.type);
    console.log('[SW message] Items:', msg.items?.length);
    console.log('[SW message] Event info:', {
        hasWaitUntil: typeof event.waitUntil === 'function',
        eventConstructor: event.constructor.name,
        isTrusted: event.isTrusted
    });

    if (!msg.type) {
        console.warn('[SW message] ⚠ Message has no type!');
        console.log('═══════════════════════════════════════════════════════');
        return;
    }

    if (msg.type === constants.SW_EVENT_SKIP_WAITING) {
        console.log('[SW message] Executing skipWaiting...');
        self.skipWaiting();
        console.log('[SW message] ✓ skipWaiting executed');
        console.log('═══════════════════════════════════════════════════════');
    } else if (msg.type === constants.SW_EVENT_REQ_CACHE_BATCH && msg.items && msg.items.length) {
        console.log('[SW message] Processing CACHE BATCH request');
        console.log('[SW message] Total items:', msg.items.length);
        console.log('[SW message] First 5 URLs:', msg.items.slice(0, 5).map(i => i.url));

        const cachePromise = processCacheBatch(msg.items, event);

        console.log('[SW message] Attempting waitUntil...');
        try {
            event.waitUntil(cachePromise);
            console.log('[SW message] ✓ waitUntil SUCCEEDED');
        } catch (e) {
            console.error('[SW message] ✗ waitUntil FAILED:', {
                name: e.name,
                message: e.message,
                isInvalidStateError: e.name === 'InvalidStateError',
                stack: e.stack
            });
            console.warn('[SW message] Promise will execute anyway...');
        }

        // Track promise directly
        cachePromise.then(() => {
            console.log('[SW message] ✓ Cache promise RESOLVED');
        }).catch(err => {
            console.error('[SW message] ✗ Cache promise REJECTED:', err);
        });

        console.log('═══════════════════════════════════════════════════════');
    }
});

async function processCacheBatch(items, event) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW processCacheBatch] START');
    console.log('[SW processCacheBatch] Total items:', items.length);
    console.log('═══════════════════════════════════════════════════════');

    let successCount = 0;
    let failCount = 0;
    const startTime = Date.now();

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemStartTime = Date.now();

        console.log(`[SW processCacheBatch] ┌─ [${i + 1}/${items.length}] Starting`);
        console.log(`[SW processCacheBatch] │  URL: ${item.url}`);
        console.log(`[SW processCacheBatch] │  Type: ${item.type}`);

        try {
            await cacheOneItem(item, event);
            const itemDuration = Date.now() - itemStartTime;
            successCount++;
            console.log(`[SW processCacheBatch] └─ [${i + 1}/${items.length}] ✓ SUCCESS (${itemDuration}ms)`);
        } catch (e) {
            const itemDuration = Date.now() - itemStartTime;
            failCount++;
            console.error(`[SW processCacheBatch] └─ [${i + 1}/${items.length}] ✗ FAILED (${itemDuration}ms)`);
            console.error(`[SW processCacheBatch]    Error:`, {
                name: e.name,
                message: e.message
            });

            sendToClients({
                type: constants.SW_EVENT_URL_CACHED,
                url: item.url,
                success: false
            });
        }

        if ((i + 1) % 10 === 0) {
            console.log(`[SW processCacheBatch] Progress: ${i + 1}/${items.length} (${successCount} success, ${failCount} failed)`);
        }
    }

    const totalDuration = Date.now() - startTime;
    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW processCacheBatch] COMPLETE');
    console.log('[SW processCacheBatch] Total items:', items.length);
    console.log('[SW processCacheBatch] Success:', successCount);
    console.log('[SW processCacheBatch] Failed:', failCount);
    console.log('[SW processCacheBatch] Duration:', totalDuration, 'ms');
    console.log('[SW processCacheBatch] Avg per item:', Math.round(totalDuration / items.length), 'ms');
    console.log('═══════════════════════════════════════════════════════');
}

async function cacheOneItem(item, event) {
    console.log('[SW cacheOneItem] ┌─ START:', item.url);

    try {
        console.log('[SW cacheOneItem] │  Adding to inFlightCacheRequests');
        inFlightCacheRequests.add(item.url);
        console.log('[SW cacheOneItem] │  inFlightCacheRequests size:', inFlightCacheRequests.size);

        let response;

        if (item.type === constants.SW_CACHE_TYPE_IMG) {
            console.log('[SW cacheOneItem] │  Type: IMAGE - using dynamicImageHandler');

            try {
                const url = new URL(item.url);
                const request = new Request(item.url);
                console.log('[SW cacheOneItem] │  URL and Request objects created');

                response = await dynamicImageHandler({
                    url: url,
                    request: request,
                    event: event
                });

                console.log('[SW cacheOneItem] │  dynamicImageHandler returned:', {
                    hasResponse: !!response,
                    type: response?.type,
                    status: response?.status,
                    ok: response?.ok
                });
            } catch (e) {
                console.error('[SW cacheOneItem] │  ✗ dynamicImageHandler threw:', {
                    name: e.name,
                    message: e.message
                });
                throw e;
            }
        } else {
            console.log('[SW cacheOneItem] │  Type: GENERIC - using strategyNormalCacheFirst');

            try {
                response = await strategyNormalCacheFirst.handle({
                    request: new Request(item.url),
                    event: event
                });

                console.log('[SW cacheOneItem] │  strategyNormalCacheFirst returned:', {
                    hasResponse: !!response,
                    status: response?.status
                });
            } catch (e) {
                console.error('[SW cacheOneItem] │  ✗ strategyNormalCacheFirst threw:', {
                    name: e.name,
                    message: e.message
                });
                throw e;
            }
        }

        console.log('[SW cacheOneItem] │  Sending success message to clients...');
        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: item.url,
            success: !!response
        });
        console.log('[SW cacheOneItem] │  Message sent');
        console.log('[SW cacheOneItem] └─ ✓ COMPLETE');

    } catch (e) {
        console.error('[SW cacheOneItem] └─ ✗ EXCEPTION CAUGHT:', {
            url: item.url,
            errorName: e.name,
            errorMessage: e.message,
            errorStack: e.stack
        });

        sendToClients({
            type: constants.SW_EVENT_URL_CACHED,
            url: item.url,
            success: false
        });

        throw e;

    } finally {
        console.log('[SW cacheOneItem]    Removing from inFlightCacheRequests');
        inFlightCacheRequests.delete(item.url);
        console.log('[SW cacheOneItem]    inFlightCacheRequests size:', inFlightCacheRequests.size);
    }
}

function isKnownImageAPI(url) {
    url = url.href ? url.href : url;
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
    console.log('[SW sendToClients] Sending message, type:', msg.type);
    self.clients.matchAll().then(clients => {
        console.log('[SW sendToClients] Found', clients.length, 'client(s)');
        clients.forEach((client, index) => {
            console.log(`[SW sendToClients] Sending to client ${index + 1}, ID:`, client.id.substring(0, 8) + '...');
            client.postMessage(msg);
        });
        console.log('[SW sendToClients] All messages sent');
    }).catch(err => {
        console.error('[SW sendToClients] ✗ matchAll FAILED:', err);
    });
}

function getImageCache() {
    if (!imageCachePromise) {
        console.log('[SW getImageCache] Opening image-cache for first time');
        imageCachePromise = caches.open('image-cache');
    }
    return imageCachePromise;
}

// ===== REMOTE DEBUGGING: Forward all console logs to page =====
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

    console.log('═══════════════════════════════════════════════════════');
    console.log('[SW INIT] ✓ Remote debugging console forwarding ENABLED');
    console.log('[SW INIT] ✓ All console logs will be sent to client');
    console.log('═══════════════════════════════════════════════════════');
}

console.log('[SW INIT] ✓ Service Worker initialization COMPLETE');
console.log('[SW INIT] Ready to receive messages');