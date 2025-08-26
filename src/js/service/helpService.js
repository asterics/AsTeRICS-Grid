import { i18nService } from './i18nService';

let helpService = {};
//let HELP_BASE_PATH = 'https://github.com/asterics/AsTeRICS-Grid/blob/master/docs/documentation_user/';
let HELP_BASE_PATH = 'https://www.asterics.eu/manuals/asterics-grid/';
let GOOGLE_TRANSLATE_BASE_PATH = 'https://translate.google.com/translate?sl=en&tl=de&u=';
//let HELP_FILE_POSTFIX = '.md';
let HELP_FILE_POSTFIX = '.html';

// Map old file references to actual existing files
const HELP_FILE_MAPPING = {
    '02_navigation': '04_navigation-overview',
    '06_users': '03_basic_setup',
    '03_appearance_layout': '07_grid-elements',
    '07_dictionaries': '10_dictionaries'
};

let _initHelpFile = '';
let _initHash = '#asterics-grid-user-documentation';
let _helpFile = _initHelpFile;
let _helpHash = _initHash;
let _lastHelpFile = _helpFile;
let _lastHelpHash = _helpHash;

/**
 * sets the current help location that will be opened if the user presses F1
 *
 * @param filename the filename of the documentation to open, excluding the file extension, e.g. "README"
 * @param hash (optional) the hash of the page to open in order to directly jump to a specific header
 */
helpService.setHelpLocation = function (filename, hash) {
    _lastHelpFile = _helpFile;
    _lastHelpHash = _helpHash;
    _helpFile = filename;
    _helpHash = !!hash ? hash : '';
};

/**
 * sets the current help path to default -> help index
 */
helpService.setHelpLocationIndex = function () {
    helpService.setHelpLocation(_initHelpFile, _initHash);
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
    // Map old file references to actual existing files
    let actualFile = _helpFile;
    if (HELP_FILE_MAPPING[_helpFile]) {
        actualFile = HELP_FILE_MAPPING[_helpFile];
    }
    
    let postfix = actualFile ? actualFile + HELP_FILE_POSTFIX + _helpHash : _helpHash;
    let link = HELP_BASE_PATH + postfix;
    /*if (i18nService.isCurrentAppLangDE()) {
        link = GOOGLE_TRANSLATE_BASE_PATH + encodeURI(link);
    }*/
    window.open(link, '_blank');
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

export { helpService };
