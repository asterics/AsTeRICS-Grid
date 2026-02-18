import {constants} from '../util/constants';

let consoleReService = {};

consoleReService.init = async function(timeout = 3000) {
    if (!constants.ENABLE_REMOTE_DEBUGGING) {
        return;
    }
    setTimeout(async () => {
        log.info("activating console.re...");
        let consoelre = await import("../../../app/lib/console.re.connector");
        if (!consoelre) {
            return log.warn('console.re not installed.');
        }
        consoelre.connect({
            server: 'https://console.re', // optional, default: https://console.re
            channel: 'asterics-aac', // required
            redirectDefaultConsoleToRemote: true, // optional, default: false
            disableDefaultConsoleOutput: true // optional, default: false
        });
    }, timeout);
};

export { consoleReService };
