var constants = {};

constants.ELEMENT_EVENT_ID = "ELEMENT_EVENT_ID";
constants.MODEL_VERSION = '{"major": 4, "minor": 0, "patch": 0}';

constants.LOCAL_NOLOGIN_USERNAME = 'default-user';
constants.LOCAL_DEMO_USERNAME = 'local-demo-user';
constants.USERNAME_REGEX = /^[a-z][a-z0-9_-]{2,50}$/;

constants.VALIDATION_ERROR_REGEX = 'VALIDATION_ERROR_REGEX';
constants.VALIDATION_ERROR_EXISTING = 'VALIDATION_ERROR_EXISTING';
constants.VALIDATION_VALID = 'VALIDATION_VALID';

constants.EVENT_DB_CONNECTION_LOST = 'EVENT_DB_CONNECTION_LOST';
constants.EVENT_DB_PULL_UPDATED = 'EVENT_DB_PULL_UPDATED';
constants.EVENT_DB_SYNC_STATE_CHANGE = 'EVENT_DB_SYNC_STATE_CHANGE';
constants.EVENT_DB_INITIALIZED = 'EVENT_DB_INITIALIZED';
constants.EVENT_DB_CLOSED = 'EVENT_DB_CLOSED';
constants.EVENT_DB_DATAMODEL_UPDATE = 'EVENT_DB_DATAMODEL_UPDATE';

constants.EVENT_SIDEBAR_OPEN = 'event-sidebar-open'; //start open
constants.EVENT_SIDEBAR_OPENED = 'event-sidebar-opened'; //after sidebar opened
constants.EVENT_SIDEBAR_CLOSE = 'event-sidebar-close';

constants.EVENT_GRID_RESIZE = 'EVENT_GRID_RESIZE';
constants.EVENT_GRID_LOADED = 'EVENT_GRID_LOADED';
constants.EVENT_USER_CHANGED = 'EVENT_USER_CHANGED';
constants.EVENT_LANGUAGE_CHANGE = 'EVENT_LANGUAGE_CHANGE';

constants.DB_SYNC_STATE_SYNCINC = 'DB_SYNC_STATE_SYNCINC';
constants.DB_SYNC_STATE_SYNCED = 'DB_SYNC_STATE_SYNCED';
constants.DB_SYNC_STATE_STOPPED = 'DB_SYNC_STATE_STOPPED';
constants.DB_SYNC_STATE_FAIL = 'DB_SYNC_STATE_FAIL';
constants.DB_SYNC_STATE_ONLINEONLY = 'DB_SYNC_STATE_ONLINEONLY';

constants.ENVIRONMENT = '#ASTERICS_GRID_ENV#';
constants.IS_ENVIRONMENT_DEV = constants.ENVIRONMENT === ('#ASTERICS_' + 'GRID_ENV#');
constants.IS_ENVIRONMENT_PROD = !constants.IS_ENVIRONMENT_DEV;
constants.CURRENT_VERSION = '#ASTERICS_GRID_VERSION#';
constants.IS_FIREFOX = navigator.userAgent.indexOf("Firefox") !== -1;

constants.STATE_ACTIVATED_TTS = 'STATE_ACTIVATED_TTS';

constants.COLOR_SCHEME_CATEGORIES = ['CC_PRONOUN', 'CC_NOUN', 'CC_VERB', 'CC_ADJECTIVE', 'CC_PREPOSITION', 'CC_JUNCTION', 'CC_QUESTION', 'CC_ADVERB', 'CC_IMPORTANT', 'CC_DETERMINER'];
constants.COLOR_SCHEME_PASTEL = [
    '#fdfd96',
    '#ffda89',
    '#77dd77',
    '#84b6f4',
    '#fdcae1',
    '#ffffff',
    '#bc98f3',
    '#d8af97',
    '#ff9688',
    '#bdbfbf'];

constants.COLOR_SCHEME_DARK = [
    '#ffff00',
    '#ffad00',
    '#00ff00',
    '#0071ff',
    '#ff0075',
    '#ffffff',
    '#9a5ff6',
    '#9a4915',
    '#ff1d00',
    '#8c8c8c'];

constants.DEFAULT_COLOR_SCHEMES = [
    {
        name: 'CS_NAME_PASTEL',
        colors: constants.COLOR_SCHEME_PASTEL
    }, {
        name: 'CS_NAME_DARK',
        colors: constants.COLOR_SCHEME_DARK
    },
];

export {constants};