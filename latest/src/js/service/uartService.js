import {MainVue} from "../vue/mainVue";
import {GridActionUART} from "../model/GridActionUART.js";
import {i18nService} from "./i18nService.js";

let uartService = {};
let btConnection = null;
let serialConnection = null;

uartService.doAction = function (action) {
    import(/* webpackPrefetch: 0 */ '/app/lib/uart.min.js').then(async (UART) => {
        let cmdString = `${action.data}`;
        cmdString = cmdString.replaceAll("\\n", "\n");
        cmdString = cmdString.replaceAll("\\r", "\r");
        if(!cmdString.endsWith('\n')) {
            cmdString += '\n';
        }

        switch (action.connectionType) {
            case GridActionUART.CONN_TYPE_BT:
                btConnection = btConnection || (await getConnection(UART.connectBluetooth));
                btConnection.on("data", (data) => console.log("received BT data:", data));
                btConnection.on("close", btClosed);
                btConnection.write(cmdString);
                break;
            case GridActionUART.CONN_TYPE_SERIAL:
                serialConnection = serialConnection || (await getConnection(UART.connectSerial));
                serialConnection.on("data", (data) => console.log("received serial data:", data));
                serialConnection.on("close", serialClosed);
                serialConnection.write(cmdString);
                break;
        }
    });
};

function reportMessage(message) {
    MainVue.setTooltip(i18nService.t(message), {
        revertOnClose: true,
        timeout: 5000,
        msgType: "warn"
    });
}

function serialClosed() {
    if(serialConnection) {
        serialConnection.close();
    }
    serialConnection = null;
    reportMessage("uartConnectionClosed");
}

function btClosed() {
    if(btConnection) {
        btConnection.close();
    }
    btConnection = null;
    reportMessage("uartConnectionClosed");
}

async function getConnection(connectFn) {
    return new Promise(resolve => {
        connectFn((connection) => {
            if (!connection) {
                reportMessage("uartActionFailedConnection");
                return;
            }
            resolve(connection);
        });
    });
}

export { uartService };
