import {MainVue} from "../vue/mainVue";

let puckjsService = {};

puckjsService.doAction = function (action) {

    import(/* webpackPrefetch: 0 */ '/app/lib/uart.js').then((
    ) => {
        let cmdString = `${action.puckjsCmd}\n`;
        log.debug(cmdString);

        UART.connect(function(connection) {
            if (!connection) {
                MainVue.setTooltip(i18nService.t("UART action failed", error), {
                    revertOnClose: true,
                    timeout: 5000
                });
                return;
            }
            connection.on('data', function(d) {
                console.log('UART got data: '+d);
            });
            connection.on('close', function() {
                console.log('UART closed: ');
            });
            // actually write the grid action command string to the device
            connection.write(cmdString, function() {
            });
        });
        /*
        //Using UART.write remembers the connection variable but does not provide a callback for error handling
        UART.write(cmdString);
         */
    });
};


export { puckjsService };
