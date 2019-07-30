let helpService = {};
let HELP_BASE_PATH = 'https://github.com/asterics/AsTeRICS-Grid/blob/master/docs/documentation_user/';
let HELP_FILE_POSTFIX = '.md';

let _helpFile = '00_index';
let _helpHash = '#asterics-grid-user-documentation';
let _lastHelpFile = _helpFile;
let _lastHelpHash = _helpHash;

/**
 * sets the current help location that will be opened if the user presses F1
 *
 * @param filename the filename of the documentation to open, excluding the file extension, e.g. "00_index"
 * @param hash (optional) the hash of the page to open in order to directly jump to a specific header
 */
helpService.setHelpLocation = function (filename, hash) {
    _lastHelpFile = _helpFile;
    _lastHelpHash = _helpHash;
    _helpFile = filename;
    _helpHash = !!hash ? hash : '';
};

/**
 * reverts to previous help location
 */
helpService.revertToLastLocation = function () {
    helpService.setHelpLocation(_lastHelpFile, _lastHelpHash);
};

/**
 * opens help in a new tab
 */
helpService.openHelp = function () {
    window.open(HELP_BASE_PATH + _helpFile + HELP_FILE_POSTFIX + _helpHash, '_blank');
};

function init() {
    window.onhelp = function () {
        return false;
    };
    window.addEventListener('keydown', function (event) {
        let keyCode = event.keyCode || event.which;
        if (keyCode === 112 || event.key === 'F1') {
            event.preventDefault();
            helpService.openHelp();
        }
    });
}

init();

export {helpService};