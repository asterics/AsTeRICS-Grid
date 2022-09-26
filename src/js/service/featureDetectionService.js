let featureDetectionService = {};

featureDetectionService.isBrowserOutdated = function () {
    if (!Modernizr.promises) {
        log.warn("Browser doesn't support promises.")
        return Promise.resolve(true);
    }
    let promise = new Promise(resolve => {
            if (Modernizr.indexeddb === undefined) {
                Modernizr.on('indexeddb', function (result) {
                    resolve(!result);
                });
            } else {
                resolve(!Modernizr.indexeddb);
            }
        }
    );
    promise.then(result => {
        if (result) {
            log.warn("Browser doesn't support indexedDB.");
        }
    });
    return promise;
};

export {featureDetectionService};