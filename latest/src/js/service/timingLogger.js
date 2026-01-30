import { encryptionService } from './data/encryptionService';
import { log } from '../util/log';

let timingLogger = {};
let servicesToLog = [];
let _customStart = null;

let simpleLastTime = 0;
let startTimes = {};
let totalTimes = {};
let maxEntry = {
    name: '',
    time: 0
};
let simpleTotalTimes = {};

/**
 * if this method is called, all method calls on services/modules
 * defined in local array "servicesToLog" are intercepted and the
 * needed time for each call is measured and logged.
 * -> helpful for identifying performance issues
 */
timingLogger.initLogging = function () {
    servicesToLog.forEach((service) => {
        timingLogger.setupTimingInterceptor(service);
    });
};

/**
 * logs the time since the last call of this function
 * @param key a custom string for identifying the log message
 */
timingLogger.log = function (key) {
    key = key ? key + ' - ' : '';
    if (!_customStart) {
        log.warn('timing log started.');
        _customStart = new Date().getTime();
        return;
    }
    log.warn(key + 'time since last log: ' + (new Date().getTime() - _customStart) + 'ms');
    _customStart = new Date().getTime();
};

timingLogger.start = function (key) {
    startTime(key);
};

timingLogger.startSimple = function () {
    log.warn('timing started!');
    simpleLastTime = new Date().getTime();
};

timingLogger.addToKeySimple = function (key) {
    simpleTotalTimes[key] = simpleTotalTimes[key] || 0;
    simpleTotalTimes[key] += new Date().getTime() - simpleLastTime;
    simpleLastTime = new Date().getTime();
}

timingLogger.logSimple = function (logMsg) {
    log.warn(`${new Date().getTime() - simpleLastTime}ms - ${logMsg}`);
    simpleLastTime = new Date().getTime();
};

timingLogger.finishSimple = function () {
    log.warn(simpleTotalTimes);
    simpleTotalTimes = {};
};

timingLogger.finish = function (key, dontLog) {
    finishTime(key, '', dontLog);
};

timingLogger.setupTimingInterceptor = function (module) {
    let moduleKey = Object.keys(module).reduce((acc, current) => acc + current);
    Object.keys(module).forEach((fnName) => {
        let originalFn = module[fnName];
        if (isFunction(originalFn)) {
            module[fnName] = function () {
                startTime(moduleKey, fnName);
                let returnValue = originalFn.apply(null, arguments);
                if (returnValue instanceof Promise) {
                    returnValue.then(() => {
                        finishTime(moduleKey, fnName);
                    });
                } else {
                    finishTime(moduleKey, fnName);
                }
                return returnValue;
            };
        }
    });
};

timingLogger.printStats = function(showAlert) {
    log.warn('timing stats:');
    for (let key of Object.keys(totalTimes)) {
        log.warn(key, totalTimes[key] + 'ms');
    }
    if (showAlert) {
        alert('timing stats: ' + JSON.stringify(totalTimes));
    }
};

timingLogger.reset = function() {
    totalTimes = {};
    startTimes = {};
    maxEntry = {
        name: '',
        time: 0
    };
    simpleLastTime = 0;
    simpleTotalTimes = {};
}

function startTime(key, fnName = '') {
    startTimes[key + fnName] = performance.now();
}

function finishTime(key, fnName = '', dontLog) {
    let operationTime = performance.now() - startTimes[key + fnName];
    if (!totalTimes[key + fnName]) {
        totalTimes[key + fnName] = operationTime;
    } else {
        totalTimes[key + fnName] += operationTime;
    }
    if (totalTimes[key + fnName] > maxEntry.time) {
        maxEntry.time = totalTimes[key + fnName];
        if (maxEntry.name !== fnName && !dontLog) {
            log.warn('new maximum time consuming method: ' + maxEntry.name + ' (' + maxEntry.time + 'ms)');
        }
        maxEntry.name = fnName || key;
    }
    if (!dontLog) {
        log.info('total needed time for ' + (fnName || key) + ': ' + totalTimes[key + fnName] + ', last operation:' + operationTime);
    }
}

function isFunction(functionToCheck) {
    return typeof functionToCheck === 'function';
}

export { timingLogger };
