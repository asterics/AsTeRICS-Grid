import { GridData } from "../model/GridData.js";

let serviceWorkerService = {};

let controller = null;

serviceWorkerService.cacheUrl = function (url) {
    postMessageInternal({
        urlToAdd: url
    });
};

serviceWorkerService.cacheImageUrl = function (url) {
    postMessageInternal({
        imageUrlToAdd: url
    });
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
                    serviceWorkerService.cacheImageUrl(element.image.url);
                }
            }
        }
    }
};

window.serviceWorkerService = serviceWorkerService;

function postMessageInternal(msg) {
    getController().then((controller) => {
        if (!controller) {
            return;
        }
        controller.postMessage(msg);
    });
}

function getController() {
    if (!navigator.serviceWorker) {
        return Promise.resolve(null);
    }
    return new Promise((resolve) => {
        if (controller) {
            return resolve(controller);
        } else {
            navigator.serviceWorker.addEventListener("message", (evt) => {
                if (evt.data && evt.data.activated) {
                    controller = navigator.serviceWorker.controller;
                    resolve(controller);
                }
            });
        }
    });
}

export { serviceWorkerService };
