let urlParamService = {};

let PARAM_DEMO_MODE = 'demo';
let PARAM_SCANNING = 'scanning';
let PARAM_RESET_DATABASE = 'reset';

urlParamService.isDemoMode = function () {
    return hasParam(PARAM_DEMO_MODE);
};

urlParamService.isScanningDisabled = function () {
    return urlParamService.isDemoMode() || isParamFalse(PARAM_SCANNING);
};

urlParamService.shouldResetDatabase = function () {
    return urlParamService.isDemoMode() || isParamTrue(PARAM_RESET_DATABASE);
};


function hasParam(name) {
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.has(name);
}

function getParam(name) {
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
}

function isParamTrue(name) {
    return getParam(name) === 'true';
}

function isParamFalse(name) {
    return getParam(name) === 'false';
}

export {urlParamService};