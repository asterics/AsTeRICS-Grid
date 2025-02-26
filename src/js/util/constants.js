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
constants.EVENT_ELEM_TEXT_CHANGED = 'EVENT_ELEM_TEXT_CHANGED';
constants.EVENT_USER_CHANGING = 'EVENT_USER_CHANGING';
constants.EVENT_USER_CHANGED = 'EVENT_USER_CHANGED';
constants.EVENT_METADATA_UPDATED = 'EVENT_METADATA_UPDATED';
constants.EVENT_APPSETTINGS_UPDATED = 'EVENT_APPSETTINGS_UPDATED';
constants.EVENT_USERSETTINGS_UPDATED = 'EVENT_USERSETTINGS_UPDATED';
constants.EVENT_CONFIG_RESET = 'EVENT_CONFIG_RESET';
constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE = 'EVENT_NAVIGATE_GRID_IN_VIEWMODE';
constants.EVENT_NAVIGATE = 'EVENT_NAVIGATE';

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
constants.IS_ENVIRONMENT_BETA = constants.ENVIRONMENT === 'BETA';
constants.IS_ENVIRONMENT_PROD = !constants.IS_ENVIRONMENT_DEV && !constants.IS_ENVIRONMENT_BETA;
constants.CURRENT_VERSION = '#ASTERICS_GRID_VERSION#';
constants.IS_FIREFOX = navigator.userAgent.indexOf('Firefox') !== -1;
constants.IS_SAFARI = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
constants.IS_MAC = (navigator.platform || ((navigator.userAgentData || {}).platform) || "").toUpperCase().includes('MAC');

constants.STATE_ACTIVATED_TTS = 'STATE_ACTIVATED_TTS';

constants.VOICE_TYPE_NATIVE = 'VOICE_TYPE_NATIVE';
constants.VOICE_TYPE_RESPONSIVEVOICE = 'VOICE_TYPE_RESPONSIVEVOICE';
constants.VOICE_TYPE_EXTERNAL_PLAYING = 'VOICE_TYPE_EXTERNAL_PLAYING';
constants.VOICE_TYPE_EXTERNAL_DATA = 'VOICE_TYPE_EXTERNAL_DATA';
constants.VOICE_DEVICE_DEFAULT = 'VOICE_DEVICE_DEFAULT';

constants.WEBRADIO_LAST_VOLUME_KEY = 'WEBRADIO_LAST_VOLUME_KEY';

constants.GRIDSET_FOLDER = 'app/gridsets/';
constants.BOARDS_REPO_BASE_URL = "https://asterics.github.io/AsTeRICS-Grid-Boards/";

constants.BOARD_TYPE_SELFCONTAINED = "BOARD_TYPE_SELFCONTAINED";
constants.BOARD_TYPE_SINGLE = "BOARD_TYPE_SINGLE";
constants.BOARD_TYPES = [constants.BOARD_TYPE_SELFCONTAINED, constants.BOARD_TYPE_SINGLE];

constants.DEFAULT_ELEMENT_BACKGROUND_COLOR = '#ffffff';
constants.DEFAULT_ELEMENT_BACKGROUND_COLOR_DARK = '#555555';
constants.DEFAULT_COLLECT_ELEMENT_BACKGROUND_COLOR = '#E8E8E8';
constants.DEFAULT_COLLECT_ELEMENT_BACKGROUND_COLOR_DARK = '#757575';
constants.DEFAULT_ELEMENT_BORDER_COLOR = '#808080';
constants.DEFAULT_ELEMENT_FONT_COLOR = '#000000';
constants.DEFAULT_ELEMENT_FONT_COLOR_DARK = '#ffffff';
constants.DEFAULT_GRID_BACKGROUND_COLOR = '#e8e8e8';
constants.DEFAULT_GRID_BACKGROUND_COLOR_DARK = '#000000';
constants.COLOR_SCHEME_FITZGERALD_PREFIX = 'CS_MODIFIED_FITZGERALD_KEY';
constants.COLOR_SCHEME_GOOSENS_PREFIX = 'CS_GOOSENS';
constants.COLOR_SCHEME_FITZGERALD_LIGHT = 'CS_MODIFIED_FITZGERALD_KEY_LIGHT';
constants.COLOR_SCHEME_FITZGERALD_MEDIUM = 'CS_MODIFIED_FITZGERALD_KEY_MEDIUM';
constants.COLOR_SCHEME_FITZGERALD_DARK = 'CS_MODIFIED_FITZGERALD_KEY_DARK';
constants.COLOR_SCHEME_GOOSENS_LIGHT = 'CS_GOOSENS_LIGHT';
constants.COLOR_SCHEME_GOOSENS_MEDIUM = 'CS_GOOSENS_MEDIUM';
constants.COLOR_SCHEME_GOOSENS_DARK = 'CS_GOOSENS_DARK';
constants.DEFAULT_COLOR_SCHEMES = [
    {
        name: constants.COLOR_SCHEME_FITZGERALD_LIGHT,
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
        name: constants.COLOR_SCHEME_FITZGERALD_MEDIUM,
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
        name: constants.COLOR_SCHEME_FITZGERALD_DARK,
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
            '#79791F',
            '#804c26',
            '#4c8026',
            '#264c80',
            '#802680',
            '#808080',
            '#602680',
            '#52331f',
            '#80261a',
            '#4d4d4d'
        ]
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_LIGHT,
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: ['#fdcae1', '#84b6f4', '#c7f3c7', '#fdfd96', '#ffda89']
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_MEDIUM,
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: ['#ff6bff', '#6bb5ff', '#b5ff6b', '#ffff6b', '#ffb56b']
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_DARK,
        categories: ['CC_VERB', 'CC_DESCRIPTOR', 'CC_PREPOSITION', 'CC_NOUN', 'CC_QUESTION_NEGATION_PRONOUN'],
        colors: [
            '#802680',
            '#264c80',
            '#4c8026',
            '#79791F',
            '#804c26']
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

// local storage keys for OAuth
constants.OAUTH_RETURNED_PARAMS_MAP = 'OAUTH_RETURNED_PARAMS_MAP';
constants.OAUTH_REDIRECT_KEY = 'OAUTH_REDIRECT_KEY';

// constants for OAuth authentication at globalsymbols
constants.GLOBALSYMBOLS_NAME = 'Global Symbols';
constants.GLOBALSYMBOLS_BASE_URL = 'http://localhost:3000/';
constants.BOARDBUILDER_BASE_URL = 'http://localhost:4200/';
constants.OAUTH_CONFIG_GLOBALSYMBOLS = {
    id: 'globalsymbols',
    authority: constants.GLOBALSYMBOLS_BASE_URL,
    client_id: 'GJa5KKWZrPs4TQfYs0ov7wg20IeurBd6xd9y4HbU-j0',
    redirect_uri: `${location.origin}${location.pathname}html/oauth-redirect.html`,
    response_type: 'code',
    scope: 'openid profile email boardset:read boardset:write offline_access',
    automaticSilentRenew: true,
    loadUserInfo: true
}
constants.OAUTH_CONFIGS = [constants.OAUTH_CONFIG_GLOBALSYMBOLS];

constants.EXPORT_ONLINE_GRID_TAGS = ["ADL", "MEDICAL", "LEISURE", "EMOTIONS", "SOCIAL", "FOOD", "CARE", "EDUCATION", "WORK", "HOSPITAL", "SMALLTALK", "4x3", "3X4", "5X6", "6X11", "5X9", "4X7"];

constants.REDIRECT_OAUTH_GS_UPLOAD = 'REDIRECT_OAUTH_GS_UPLOAD'; // redirect to upload modal
constants.REDIRECT_IMPORT_DATA_ONLINE = 'REDIRECT_IMPORT_DATA_ONLINE'; // redirect to import modal from online resource

export { constants };
