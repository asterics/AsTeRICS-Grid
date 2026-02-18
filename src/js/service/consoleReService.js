let consoleReService = {};

consoleReService.init = function() {
    if (!console.re) {
        return log.warn('console.re not installed.');
    }
    console.re.connect({
        server: 'https://console.re', // optional, default: https://console.re
        channel: 'channel-id', // required
        redirectDefaultConsoleToRemote: true, // optional, default: false
        disableDefaultConsoleOutput: false // optional, default: false
    });
};

export { consoleReService };
