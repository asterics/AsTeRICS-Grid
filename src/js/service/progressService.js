import {timingLogger} from "./timingLogger";

let progressService = {};

let _progressPercentage = null;
let _progressText = null;
let _updateHandlers = [];

/**
 * sets the progress of any long-term action actually performing
 * @param progressPercentage in range 0..1
 * @param progressText
 */
progressService.setProgress = function (progressText, progressPercentage) {
    timingLogger.log('now')
    _progressPercentage = Math.round(progressPercentage * 100);
    _progressText = progressText;
    _updateHandlers.forEach(handler => {
        handler(_progressText, _progressPercentage);
    })
};

progressService.register = function (fn) {
    _updateHandlers.push(fn);
};

progressService.clearHandlers = function () {
    _updateHandlers = [];
};

export {progressService};