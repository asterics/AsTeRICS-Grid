import {constants} from '../util/constants';

let consoleReService = {};

consoleReService.init = async function() {
    if (!constants.ENABLE_REMOTE_DEBUGGING) {
        return;
    }
    let consoelre = await import("../../../app/lib/console.re.connector");
    if (!consoelre) {
        return log.warn('console.re not installed.');
    }
    consoelre.connect({
        server: 'https://console.re', // optional, default: https://console.re
        channel: 'channel-id', // required
        redirectDefaultConsoleToRemote: true, // optional, default: false
        disableDefaultConsoleOutput: false // optional, default: false
    });
};

export { consoleReService };
