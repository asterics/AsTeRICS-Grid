let constants = {};

constants.ELEMENT_EVENT_ID = 'ELEMENT_EVENT_ID';
constants.MODEL_VERSION = '{"major": 6, "minor": 0, "patch": 0}';
constants.MODEL_VERSION_LOCAL = '{"major": 1, "minor": 0, "patch": 0}';

constants.LOCAL_NOLOGIN_USERNAME = 'default-user';
constants.LOCAL_DEMO_USERNAME = 'local-demo-user';
constants.LOCAL_DEFAULT_USER_PREFIX = 'default-';
constants.USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,15}$/;

constants.VALIDATION_ERROR_REGEX = 'VALIDATION_ERROR_REGEX';
constants.VALIDATION_ERROR_EXISTING = 'VALIDATION_ERROR_EXISTING';
constants.VALIDATION_ERROR_FAILED = 'VALIDATION_ERROR_FAILED';
constants.VALIDATION_VALID = 'VALIDATION_VALID';

constants.EVENT_DB_CONNECTION_LOST = 'EVENT_DB_CONNECTION_LOST';
constants.EVENT_DB_PULL_UPDATED = 'EVENT_DB_PULL_UPDATED';
constants.EVENT_DB_SYNC_STATE_CHANGE = 'EVENT_DB_SYNC_STATE_CHANGE';
constants.EVENT_DB_INITIAL_SYNC_COMPLETE = 'EVENT_DB_INITIAL_SYNC_COMPLETE';
constants.EVENT_DB_INITIALIZED = 'EVENT_DB_INITIALIZED';
constants.EVENT_DB_CLOSED = 'EVENT_DB_CLOSED';
constants.EVENT_DB_DATAMODEL_UPDATE = 'EVENT_DB_DATAMODEL_UPDATE';

constants.EVENT_GRID_IMAGES_CACHING = 'EVENT_GRID_IMAGES_CACHING';
constants.EVENT_GRID_IMAGES_CACHED = 'EVENT_GRID_IMAGES_CACHED';

constants.EVENT_SIDEBAR_OPEN = 'event-sidebar-open'; //start open
constants.EVENT_SIDEBAR_OPENED = 'event-sidebar-opened'; //after sidebar opened
constants.EVENT_SIDEBAR_CLOSE = 'event-sidebar-close';
constants.EVENT_UI_LOCKED = 'EVENT_UI_LOCKED';
constants.EVENT_UI_UNLOCKED = 'EVENT_UI_UNLOCKED';

constants.EVENT_GRID_RESIZE = 'EVENT_GRID_RESIZE';
constants.EVENT_GRID_LOADED = 'EVENT_GRID_LOADED';
constants.EVENT_USER_CHANGING = 'EVENT_USER_CHANGING';
constants.EVENT_USER_CHANGED = 'EVENT_USER_CHANGED';
constants.EVENT_METADATA_UPDATED = 'EVENT_METADATA_UPDATED';
constants.EVENT_APPSETTINGS_UPDATED = 'EVENT_APPSETTINGS_UPDATED';
constants.EVENT_USERSETTINGS_UPDATED = 'EVENT_USERSETTINGS_UPDATED';
constants.EVENT_CONFIG_RESET = 'EVENT_CONFIG_RESET';
constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE = 'EVENT_NAVIGATE_GRID_IN_VIEWMODE';
constants.EVENT_NAVIGATE = 'EVENT_NAVIGATE';
constants.EVENT_RELOAD_CURRENT_GRID = 'EVENT_RELOAD_CURRENT_GRID';

constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE = 'SW_EVENT_REQ_CACHE';
constants.SW_CACHE_TYPE_IMG = 'CACHE_TYPE_IMG';
constants.SW_CACHE_TYPE_GENERIC = 'CACHE_TYPE_GENERIC';

constants.DB_SYNC_STATE_SYNCINC = 'DB_SYNC_STATE_SYNCINC';
constants.DB_SYNC_STATE_SYNCED = 'DB_SYNC_STATE_SYNCED';
constants.DB_SYNC_STATE_STOPPED = 'DB_SYNC_STATE_STOPPED';
constants.DB_SYNC_STATE_FAIL = 'DB_SYNC_STATE_FAIL';
constants.DB_SYNC_STATE_ONLINEONLY = 'DB_SYNC_STATE_ONLINEONLY';

constants.ENVIRONMENT = '#ASTERICS_GRID_ENV#';
constants.IS_ENVIRONMENT_DEV = constants.ENVIRONMENT === '#ASTERICS_' + 'GRID_ENV#';
constants.IS_ENVIRONMENT_PROD = !constants.IS_ENVIRONMENT_DEV;
constants.CURRENT_VERSION = '#ASTERICS_GRID_VERSION#';
constants.IS_FIREFOX = navigator.userAgent.indexOf('Firefox') !== -1;
constants.IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

constants.STATE_ACTIVATED_TTS = 'STATE_ACTIVATED_TTS';

constants.VOICE_TYPE_NATIVE = 'VOICE_TYPE_NATIVE';
constants.VOICE_TYPE_RESPONSIVEVOICE = 'VOICE_TYPE_RESPONSIVEVOICE';
constants.VOICE_TYPE_EXTERNAL_PLAYING = 'VOICE_TYPE_EXTERNAL_PLAYING';
constants.VOICE_TYPE_EXTERNAL_DATA = 'VOICE_TYPE_EXTERNAL_DATA';

constants.GRIDSET_FOLDER = 'app/gridsets/';

constants.BOARD_TYPE_SELFCONTAINED = "BOARD_TYPE_SELFCONTAINED";
constants.BOARD_TYPE_SINGLE = "BOARD_TYPE_SINGLE";
constants.BOARD_TYPES = [constants.BOARD_TYPE_SELFCONTAINED, constants.BOARD_TYPE_SINGLE];

constants.DEFAULT_ELEMENT_BACKGROUND_COLOR = '#ffffff';
constants.DEFAULT_GRID_BACKGROUND_COLOR = '#e8e8e8';
constants.DEFAULT_COLOR_SCHEMES = [
    {
        name: 'CS_MODIFIED_FITZGERALD_KEY_LIGHT',
        categories: [
            'CC_PRONOUN_PERSON_NAME',
            'CC_NOUN',
            'CC_VERB',
            'CC_DESCRIPTOR',
            'CC_SOCIAL_EXPRESSIONS',
            'CC_MISC',
            'CC_PLACE',
            'CC_CATEGORY',
            'CC_IMPORTANT',
            'CC_OTHERS'
        ],
        colors: [
            '#fdfd96',
            '#ffda89',
            '#c7f3c7',
            '#84b6f4',
            '#fdcae1',
            '#ffffff',
            '#bc98f3',
            '#d8af97',
            '#ff9688',
            '#bdbfbf'
        ]
    },
    {
        name: 'CS_MODIFIED_FITZGERALD_KEY_MEDIUM',
        categories: [
            'CC_PRONOUN_PERSON_NAME',
            'CC_NOUN',
            'CC_VERB',
            'CC_DESCRIPTOR',
            'CC_SOCIAL_EXPRESSIONS',
            'CC_MISC',
            'CC_PLACE',
            'CC_CATEGORY',
            'CC_IMPORTANT',
            'CC_OTHERS'
        ],
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
            '#a3a3a3'
        ]
    },
    {
        name: 'CS_GOOSENS_LIGHT',
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: ['#fdcae1', '#84b6f4', '#c7f3c7', '#fdfd96', '#ffda89']
    },
    {
        name: 'CS_GOOSENS_MEDIUM',
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: ['#ff6bff', '#6bb5ff', '#b5ff6b', '#ffff6b', '#ffb56b']
    }
];

constants.OPTION_TYPES = {
    BOOLEAN: 'BOOLEAN',
    COLOR: 'COLOR',
    SELECT: 'SELECT',
    SELECT_COLORS: 'SELECT_COLORS'
};

constants.ARASAAC_AUTHOR = 'ARASAAC - CC (BY-NC-SA)';
constants.ARASAAC_LICENSE_URL = 'https://arasaac.org/terms-of-use';

constants.WORDFORM_TAG_BASE = 'BASE';
constants.WORDFORM_TAGS = [
    constants.WORDFORM_TAG_BASE,
    'NEGATION',
    'SINGULAR',
    'PLURAL',
    '1.PERS',
    '2.PERS',
    '3.PERS',
    '1.CASE',
    '2.CASE',
    '3.CASE',
    '4.CASE',
    '5.CASE',
    '6.CASE',
    'FEMININE',
    'MASCULINE',
    'NEUTRAL',
    'COMPARATIVE',
    'SUPERLATIVE',
    'PRESENT',
    'PAST',
    'FUTURE',
    'INDEFINITE',
    'DEFINITE'
];

constants.OAUTH_RETURNED_PARAMS_MAP = 'OAUTH_RETURNED_PARAMS_MAP';
constants.OAUTH_CONFIG_GLOBALSYMBOLS = {
    id: 'globalsymbols',
    authority: 'http://localhost:3000',
    client_id: 'GJa5KKWZrPs4TQfYs0ov7wg20IeurBd6xd9y4HbU-j0',
    redirect_uri: 'http://localhost:9095/html/oauth-redirect.html',
    response_type: 'code',
    scope: 'openid profile email boardset:read boardset:write offline_access',
    automaticSilentRenew: true,
    loadUserInfo: true
}
constants.OAUTH_CONFIGS = [constants.OAUTH_CONFIG_GLOBALSYMBOLS];

export { constants };
