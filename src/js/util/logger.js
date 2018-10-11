var logger = {};

logger.LOGLEVEL_DEBUG = 1;
logger.LOGLEVEL_INFO = 2;
logger.LOGLEVEL_WARN = 3;
logger.LOGLEVEL_ERROR = 4;

var _logLevel = logger.LOGLEVEL_WARN;

logger.debug = function (text) {
    if(_logLevel <= logger.LOGLEVEL_DEBUG) {
        console.debug(text);
    }
};

logger.info = function (text) {
    if(_logLevel <= logger.LOGLEVEL_INFO) {
        console.info(text);
    }
};

logger.warn = function (text) {
    if(_logLevel <= logger.LOGLEVEL_WARN) {
        console.warn(text);
    }
};

logger.error = function (text) {
    if(_logLevel <= logger.LOGLEVEL_ERROR) {
        console.error(text);
    }
};

logger.installGlobal = function (loglevel) {
    _loglevel = loglevel || _logLevel;
    window.logger = logger;
};

export {logger};