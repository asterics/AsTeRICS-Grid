let serviceWorkerService = {};

let controller = null;

serviceWorkerService.cacheUrl = function (url) {
    postMessageInternal({
        urlToAdd: url
    })
};

serviceWorkerService.cacheImageUrl = function (url) {
    postMessageInternal({
        imageUrlToAdd: url
    })
};

function postMessageInternal(msg) {
    getController().then(controller => {
        controller.postMessage(msg);
    })
}

function getController() {
    return new Promise(resolve => {
        if (controller) {
            return resolve(controller);
        } else {
            navigator.serviceWorker.addEventListener("message", (evt) => {
                if (evt.data && evt.data.activated) {
                    controller = navigator.serviceWorker.controller
                    resolve(controller);
                }
            });
        }
    });
}

export {serviceWorkerService};