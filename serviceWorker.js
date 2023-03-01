importScripts('app/lib/workbox-sw.js');

if (!workbox) {
    console.log("Workbox in service worker failed to load!");
}
self.__WB_DISABLE_DEV_LOGS = true;
/*workbox.setConfig({
    debug: true
});*/

self.addEventListener('install', (event) => {
    console.log('installing service worker ...');
    let urls = ["/","/latest/","index.html","app/build/5.bundle.js","app/build/6.bundle.js","app/build/7.bundle.js","app/build/asterics-grid.bundle.js","app/build/JSZip.bundle.js","app/build/vendors~hls.js.bundle.js","app/build/vendors~html2canvas.bundle.js","app/build/vendors~jspdf.bundle.js","app/build/vendors~JSZip.bundle.js","app/css/bootstrap-grid.css","app/css/custom.css","app/css/fontawesome/css/all.css","app/css/fontawesome/webfonts/fa-brands-400.eot","app/css/fontawesome/webfonts/fa-brands-400.svg","app/css/fontawesome/webfonts/fa-brands-400.ttf","app/css/fontawesome/webfonts/fa-brands-400.woff","app/css/fontawesome/webfonts/fa-brands-400.woff2","app/css/fontawesome/webfonts/fa-regular-400.eot","app/css/fontawesome/webfonts/fa-regular-400.svg","app/css/fontawesome/webfonts/fa-regular-400.ttf","app/css/fontawesome/webfonts/fa-regular-400.woff","app/css/fontawesome/webfonts/fa-regular-400.woff2","app/css/fontawesome/webfonts/fa-solid-900.eot","app/css/fontawesome/webfonts/fa-solid-900.svg","app/css/fontawesome/webfonts/fa-solid-900.ttf","app/css/fontawesome/webfonts/fa-solid-900.woff","app/css/fontawesome/webfonts/fa-solid-900.woff2","app/css/images/ui-icons_444444_256x240.png","app/css/images/ui-icons_555555_256x240.png","app/css/images/ui-icons_777620_256x240.png","app/css/images/ui-icons_777777_256x240.png","app/css/images/ui-icons_cc0000_256x240.png","app/css/images/ui-icons_ffffff_256x240.png","app/css/jquery-ui.css","app/css/skeleton.css","app/gridsets/gridset_metadata.json","app/img/app-icons/Icon-144.png","app/img/app-icons/Icon-192.png","app/img/app-icons/Icon-36.png","app/img/app-icons/Icon-48.png","app/img/app-icons/Icon-512.png","app/img/app-icons/Icon-72.png","app/img/app-icons/Icon-96.png","app/img/arasaac.png","app/img/asterics-grid-icon-inkscape.svg","app/img/asterics-grid-icon-raw.svg","app/img/asterics-grid-icon.png","app/img/asterics-grid-iconHQ.png","app/img/asterics_icon.png","app/img/betterplace-donation-button.png","app/img/favicon.ico","app/img/fhtw.svg","app/img/logo_with_border.png","app/img/ma23_logo_neu.jpg","app/img/responsive-voice-license.png","app/index.html","app/lib/dom-i18n.min.js","app/lib/gridList.js","app/lib/jquery-ui.min.js","app/lib/jquery.contextMenu.min.js","app/lib/jquery.gridList.js","app/lib/jquery.min.js","app/lib/jquery.ui.position.min.js","app/lib/jquery.ui.touchpunch.min.js","app/lib/loglevel.min.js","app/lib/modernizr-custom.js","app/lib/object-model.min.js","app/lib/pouchdb-7.0.0.min.js","app/lib/responsive-voice.js","app/lib/sjcl.min.js","app/lib/workbox-sw.js","app/manifest.appcache","app/manifest.webmanifest","app/privacy_de.html","app/privacy_en.html"];
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
    self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({activated: true}));
    });
    console.log('Service Worker active! Version: https://github.com/asterics/AsTeRICS-Grid/releases/tag/release-2023-03-01-09.24/+0100');
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.urlToAdd) {
        console.debug(`adding ${event.data.urlToAdd} to normal cache...`);
        const cacheName = workbox.core.cacheNames.runtime;
        caches.open(cacheName).then((cache) => {
            cache.add(event.data.urlToAdd);
        });
    }
    if (event.data && event.data.imageUrlToAdd) {
        caches.open('image-cache').then(async (cache) => {
            let response = await cache.match(event.data.imageUrlToAdd);
            if (!response || response.status !== 200) {
                console.debug(`adding ${event.data.imageUrlToAdd} to image cache...`);
                cache.add(event.data.imageUrlToAdd);
            }
        });
    }
});

workbox.routing.registerRoute(({url, request, event}) => {
    //console.debug(`${url.href} should cache normal: ${shouldCacheNormal(url, request)}`);
    return shouldCacheNormal(url, request);
}, new workbox.strategies.CacheFirst());

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

function shouldCacheImage(url, request) {
    let isOwnHost = url.hostname === 'localhost' || url.hostname === 'grid.asterics.eu';
    let isImageRequest = request.destination === 'image';
    return !isOwnHost && isImageRequest;
}

function shouldCacheNormal(url, request) {
    let isOwnHost = url.hostname === 'localhost' || url.hostname === 'grid.asterics.eu';
    return !shouldCacheImage(url, request) && isOwnHost;
}