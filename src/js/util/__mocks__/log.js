let log = {};
let enabled = false;

log.error = function () { logInternal(arguments); };
log.warn = function () { logInternal(arguments); };
log.info = function () { logInternal(arguments); };
log.debug = function () { logInternal(arguments); };
log.trace = function () { logInternal(arguments); };

function logInternal(args) {
    if(enabled) {
        console.log(args);
    }
}
export {log};