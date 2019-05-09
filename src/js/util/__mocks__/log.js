let log = {};
let enabled = false;

log.levels = {};
log.levels.DEBUG = 1;
log.levels.INFO = 2;
log.levels.WARN = 3;
log.levels.ERROR = 4;

log.error = function () { logInternal(arguments); };
log.warn = function () { logInternal(arguments); };
log.info = function () { logInternal(arguments); };
log.debug = function () { logInternal(arguments); };
log.trace = function () { logInternal(arguments); };
log.getLevel = function () { return log.levels.ERROR };

function logInternal(args) {
    if(enabled) {
        console.log(args);
    }
}
export {log};