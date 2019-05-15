import {encryptionService} from "./data/encryptionService";
import {log} from "../util/log";

let timingLogger = {};
let servicesToLog = [encryptionService];

let startTimes = {};
let totalTimes = {};
let maxEntry = {
    name: '',
    time: 0
};

/**
 * if this method is called, all method calls on services/modules
 * defined in local array "servicesToLog" are intercepted and the
 * needed time for each call is measured and logged.
 * -> helpful for identifying performance issues
 */
timingLogger.initLogging = function () {
    servicesToLog.forEach(service => {
        setupTimingInterceptor(service);
    })
};

function setupTimingInterceptor(module) {
    let moduleKey = Object.keys(module).reduce((acc, current) => acc + current);
    Object.keys(module).forEach(fnName => {
        let originalFn = module[fnName];
        if (isFunction(originalFn)) {
            module[fnName] = function () {
                startTime(moduleKey, fnName);
                let returnValue = originalFn.apply(null, arguments);
                finishTime(moduleKey, fnName);
                return returnValue;
            }
        }

    })
}

function startTime(key, fnName) {
    startTimes[key + fnName] = new Date().getTime();
}

function finishTime(key, fnName) {
    let operationTime = new Date().getTime() - startTimes[key + fnName];
    if (!totalTimes[key + fnName]) {
        totalTimes[key + fnName] = operationTime;
    } else {
        totalTimes[key + fnName] += operationTime;
    }
    if (totalTimes[key + fnName] > maxEntry.time) {
        maxEntry.time = totalTimes[key + fnName];
        if (maxEntry.name !== fnName) {
            log.warn('new maximum time consuming method: ' + maxEntry.name);
        }
        maxEntry.name = fnName;
    }
    log.info('total needed time for ' + fnName + ': ' + totalTimes[key + fnName] + ', last operation:' + operationTime);
}

function isFunction(functionToCheck) {
    return typeof functionToCheck === "function";
}

export {timingLogger};