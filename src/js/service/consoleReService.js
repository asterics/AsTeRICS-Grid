import {constants} from '../util/constants';

let consoleReService = {};

consoleReService.init = async function() {
    if (!constants.ENABLE_REMOTE_DEBUGGING) {
        return;
    }
    log.info("activating console.re...");
    let consolere = await import("../../../app/lib/console.re.connector");
    if (!consolere) {
        return log.warn('console.re not installed.');
    }
    consolere.connect({
        server: 'https://console.re', // optional, default: https://console.re
        channel: 'asterics-aac', // required
        redirectDefaultConsoleToRemote: false, // optional, default: false
        disableDefaultConsoleOutput: true // optional, default: false
    });
    const original = { ...console };
    const original2 = { ...log };
    ["log","info","warn","error","debug"].forEach(method => {
        console[method] = function(...args) {
            try {
                consolere[method](...args);
            } catch {}
            return original[method].apply(console, args);
        };
        log[method] = function(...args) {
            try {
                consolere[method](...args);
            } catch {}
            return original2[method].apply(log, args);
        };
    });
    window.consolere = consolere;
};

export { consoleReService };
