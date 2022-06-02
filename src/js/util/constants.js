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

constants.DEFAULT_ELEMENT_BACKGROUND_COLOR = '#ffffff';
constants.DEFAULT_GRID_BACKGROUND_COLOR = '#e8e8e8';
constants.DEFAULT_COLOR_SCHEMES = [
    {
        name: 'CS_MODIFIED_FITZGERALD_KEY_LIGHT',
        categories: ['CC_PRONOUN_PERSON_NAME', 'CC_NOUN', 'CC_VERB', 'CC_DESCRIPTOR', 'CC_SOCIAL_EXPRESSIONS', 'CC_MISC', 'CC_PLACE', 'CC_CATEGORY', 'CC_IMPORTANT', 'CC_OTHERS'],
        colors: [
            '#fdfd96',
            '#ffda89',
            '#77dd77',
            '#84b6f4',
            '#fdcae1',
            '#ffffff',
            '#bc98f3',
            '#d8af97',
            '#ff9688',
            '#bdbfbf']
    }, {
        name: 'CS_MODIFIED_FITZGERALD_KEY_MEDIUM',
        categories: ['CC_PRONOUN_PERSON_NAME', 'CC_NOUN', 'CC_VERB', 'CC_DESCRIPTOR', 'CC_SOCIAL_EXPRESSIONS', 'CC_MISC', 'CC_PLACE', 'CC_CATEGORY', 'CC_IMPORTANT', 'CC_OTHERS'],
        colors: [
            '#ffff6b',
            '#ffb56b',
            '#b5ff6b',
            '#6bb5ff',
            '#ff6bff',
            '#ffffff',
            '#ce6bff',
            '#bd754e',
            '#ff704d',
            '#a3a3a3']
    },
    {
        name: 'CS_GOOSENS_LIGHT',
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: [
            '#fdcae1',
            '#84b6f4',
            '#77dd77',
            '#fdfd96',
            '#ffda89']
    },
    {
        name: 'CS_GOOSENS_MEDIUM',
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: [
            '#ff6bff',
            '#6bb5ff',
            '#b5ff6b',
            '#ffff6b',
            '#ffb56b']
    }
];

export {constants};