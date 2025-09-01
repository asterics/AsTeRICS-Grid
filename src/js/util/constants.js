let constants = {};

constants.ELEMENT_EVENT_ID = 'ELEMENT_EVENT_ID';
constants.MODEL_VERSION = '{"major": 6, "minor": 0, "patch": 0}';
constants.MODEL_VERSION_LOCAL = '{"major": 1, "minor": 0, "patch": 0}';

constants.LOCAL_NOLOGIN_USERNAME = 'default-user';
constants.LOCAL_DEMO_USERNAME = 'local-demo-user';
constants.LOCAL_DEFAULT_USER_PREFIX = 'default-';
constants.USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{2,15}$/;
constants.EMOJI_REGEX = /((\p{Regional_Indicator}{2})|((\p{Emoji}(?:\uFE0F|\u200D\p{Emoji})*)\u20E3?))/gu;

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
constants.EVENT_USER_DELETED = 'EVENT_USER_DELETED';
constants.EVENT_METADATA_UPDATED = 'EVENT_METADATA_UPDATED';
constants.EVENT_APPSETTINGS_UPDATED = 'EVENT_APPSETTINGS_UPDATED';
constants.EVENT_USERSETTINGS_UPDATED = 'EVENT_USERSETTINGS_UPDATED';
constants.EVENT_CONFIG_RESET = 'EVENT_CONFIG_RESET';
constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE = 'EVENT_NAVIGATE_GRID_IN_VIEWMODE';
constants.EVENT_NAVIGATE = 'EVENT_NAVIGATE';
constants.EVENT_SPEAKING_TEXT = 'EVENT_SPEAKING_TEXT';

constants.EVENT_MATRIX_SCROLL_UP = 'EVENT_MATRIX_SCROLL_UP';
constants.EVENT_MATRIX_SCROLL_DOWN = 'EVENT_MATRIX_SCROLL_DOWN';
constants.EVENT_MATRIX_SET_ROOM = 'EVENT_MATRIX_SET_ROOM';
constants.EVENT_MATRIX_SENDING_START = 'EVENT_MATRIX_SENDING_START';

constants.SW_EVENT_ACTIVATED = 'SW_EVENT_ACTIVATED';
constants.SW_EVENT_URL_CACHED = 'SW_EVENT_URL_CACHED';
constants.SW_EVENT_REQ_CACHE = 'SW_EVENT_REQ_CACHE';
constants.SW_MATRIX_REQ_DATA = 'SW_MATRIX_REQ_DATA';
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
constants.PODCAST_LAST_VOLUME_KEY = 'PODCAST_LAST_VOLUME_KEY';

constants.GRIDSET_FOLDER = 'app/gridsets/';
constants.BOARDS_REPO_BASE_URL = "https://asterics.github.io/AsTeRICS-Grid-Boards/";

constants.BOARD_TYPE_SELFCONTAINED = "BOARD_TYPE_SELFCONTAINED";
constants.BOARD_TYPE_SINGLE = "BOARD_TYPE_SINGLE";
constants.BOARD_TYPES = [constants.BOARD_TYPE_SELFCONTAINED, constants.BOARD_TYPE_SINGLE];

constants.COLORS = {
    WHITE: '#ffffff',
    WHITESMOKE: '#f5f5f5',
    GRAY: '#808080',
    BLACK: '#000000',
    PREDICT_BACKGROUND: '#FFE4B2',
    LIVE_BACKGROUND: '#C6ECFD'
}

constants.PROP_TRANSFER_DONT_CHANGE = "PROP_TRANSFER_DONT_CHANGE";
constants.PROP_TRANSFER_TYPES = {
    BOOLEAN: "BOOLEAN",
    COLOR: "COLOR",
    PERCENTAGE: "PERCENTAGE",
    TEXT: "TEXT",
    NUMBER: "NUMBER"
};
constants.PROP_TRANSFER_CATEGORIES = {
    APPEARANCE: "APPEARANCE",
    OTHERS: "OTHERS"
};
constants.TRANSFER_PROPS = {
    COLOR_CATEGORY: {
        path: 'colorCategory',
        label: 'colorCategory',
        type: constants.PROP_TRANSFER_TYPES.TEXT,
        category: constants.PROP_TRANSFER_CATEGORIES.APPEARANCE
    },
    BACKGROUND_COLOR: {
        path: 'backgroundColor',
        label: 'customBackgroundColor',
        type: constants.PROP_TRANSFER_TYPES.COLOR,
        category: constants.PROP_TRANSFER_CATEGORIES.APPEARANCE
    },
    BORDER_COLOR: {
        path: 'borderColor',
        label: 'customBorderColor',
        type: constants.PROP_TRANSFER_TYPES.COLOR,
        category: constants.PROP_TRANSFER_CATEGORIES.APPEARANCE
    },
    FONT_COLOR: {
        path: 'fontColor',
        label: 'fontColor',
        type: constants.PROP_TRANSFER_TYPES.COLOR,
        category: constants.PROP_TRANSFER_CATEGORIES.APPEARANCE
    },
    FONT_SIZE: {
        path: 'fontSizePct',
        label: 'fontSize',
        type: constants.PROP_TRANSFER_TYPES.PERCENTAGE,
        category: constants.PROP_TRANSFER_CATEGORIES.APPEARANCE
    },
    HIDDEN: {
        path: 'hidden',
        label: 'hideElement',
        type: constants.PROP_TRANSFER_TYPES.BOOLEAN,
        category: constants.PROP_TRANSFER_CATEGORIES.OTHERS
    },
    LANGUAGE_LEVEL: {
        path: 'vocabularyLevel',
        label: 'vocabularyLevel',
        type: constants.PROP_TRANSFER_TYPES.NUMBER,
        category: constants.PROP_TRANSFER_CATEGORIES.OTHERS
    },
    DONT_COLLECT: {
        path: 'dontCollect',
        label: 'dontAddElementToCollectElement',
        type: constants.PROP_TRANSFER_TYPES.BOOLEAN,
        category: constants.PROP_TRANSFER_CATEGORIES.OTHERS
    },
    TOGGLE_IN_BAR: {
        path: 'toggleInBar',
        label: 'toggleInCollectionElementIfAddedMultipleTimes',
        type: constants.PROP_TRANSFER_TYPES.BOOLEAN,
        category: constants.PROP_TRANSFER_CATEGORIES.OTHERS
    }
}

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
constants.COLOR_SCHEME_MONTESSORI_PREFIX = 'CS_MONTESSORI';
constants.COLOR_SCHEME_FITZGERALD_VERY_LIGHT = 'CS_MODIFIED_FITZGERALD_KEY_VERY_LIGHT';
constants.COLOR_SCHEME_FITZGERALD_LIGHT = 'CS_MODIFIED_FITZGERALD_KEY_LIGHT';
constants.COLOR_SCHEME_FITZGERALD_MEDIUM = 'CS_MODIFIED_FITZGERALD_KEY_MEDIUM';
constants.COLOR_SCHEME_FITZGERALD_DARK = 'CS_MODIFIED_FITZGERALD_KEY_DARK';
constants.COLOR_SCHEME_GOOSENS_VERY_LIGHT = 'CS_GOOSENS_VERY_LIGHT';
constants.COLOR_SCHEME_GOOSENS_LIGHT = 'CS_GOOSENS_LIGHT';
constants.COLOR_SCHEME_GOOSENS_MEDIUM = 'CS_GOOSENS_MEDIUM';
constants.COLOR_SCHEME_GOOSENS_DARK = 'CS_GOOSENS_DARK';
constants.COLOR_SCHEME_MONTESSORI_VERY_LIGHT = 'CS_MONTESSORI_VERY_LIGHT';
constants.COLOR_SCHEME_MONTESSORI_LIGHT = 'CS_MONTESSORI_LIGHT';
constants.COLOR_SCHEME_MONTESSORI_MEDIUM = 'CS_MONTESSORI_MEDIUM';
constants.COLOR_SCHEME_MONTESSORI_DARK = 'CS_MONTESSORI_DARK';
constants.CC_PRONOUN_PERSON_NAME = 'CC_PRONOUN_PERSON_NAME';
constants.CC_NOUN = 'CC_NOUN';
constants.CC_VERB = 'CC_VERB';
constants.CC_DESCRIPTOR = 'CC_DESCRIPTOR';
constants.CC_SOCIAL_EXPRESSIONS = 'CC_SOCIAL_EXPRESSIONS';
constants.CC_MISC = 'CC_MISC';
constants.CC_PLACE = 'CC_PLACE';
constants.CC_CATEGORY = 'CC_CATEGORY';
constants.CC_IMPORTANT = 'CC_IMPORTANT';
constants.CC_OTHERS = 'CC_OTHERS';
constants.CC_PREPOSITION = 'CC_PREPOSITION';
constants.CC_QUESTION_NEGATION_PRONOUN = 'CC_QUESTION_NEGATION_PRONOUN';
constants.CC_ARTICLE = 'CC_ARTICLE';
constants.CC_ADJECTIVE = 'CC_ADJECTIVE';
constants.CC_ADVERB = 'CC_ADVERB';
constants.CC_CONJUNCTION = 'CC_CONJUNCTION';
constants.CC_INTERJECTION = 'CC_INTERJECTION';
constants.CS_FITZGERALD_CATEGORIES = [
    constants.CC_PRONOUN_PERSON_NAME,
    constants.CC_NOUN,
    constants.CC_VERB,
    constants.CC_DESCRIPTOR,
    constants.CC_SOCIAL_EXPRESSIONS,
    constants.CC_MISC,
    constants.CC_PLACE,
    constants.CC_CATEGORY,
    constants.CC_IMPORTANT,
    constants.CC_OTHERS
];
constants.CS_GOOSSENS_CATEGORIES = [constants.CC_VERB, constants.CC_DESCRIPTOR, constants.CC_PREPOSITION, constants.CC_NOUN, constants.CC_QUESTION_NEGATION_PRONOUN];
constants.CS_MONTESSORI_CATEGORIES = [
    constants.CC_NOUN,
    constants.CC_ARTICLE,
    constants.CC_ADJECTIVE,
    constants.CC_VERB,
    constants.CC_PREPOSITION,
    constants.CC_ADVERB,
    constants.CC_PRONOUN_PERSON_NAME,
    constants.CC_CONJUNCTION,
    constants.CC_INTERJECTION,
    constants.CC_CATEGORY
];
constants.CS_MAPPING_TO_FITZGERALD = {
    "CC_ADJECTIVE": constants.CC_DESCRIPTOR,
    "CC_ADVERB": constants.CC_DESCRIPTOR,
    "CC_ARTICLE": constants.CC_MISC,
    "CC_PREPOSITION": constants.CC_MISC,
    "CC_CONJUNCTION": constants.CC_MISC,
    "CC_INTERJECTION": constants.CC_SOCIAL_EXPRESSIONS
};

// very light: for color mode background + border
// light: for color mode background
// medium: for color mode border
// dark: color modes [background] or [background + border] for dark mode
constants.DEFAULT_COLOR_SCHEMES = [
    {
        name: constants.COLOR_SCHEME_FITZGERALD_VERY_LIGHT,
        categories: constants.CS_FITZGERALD_CATEGORIES,
        mappings: constants.CS_MAPPING_TO_FITZGERALD,
        colors: [
            '#fafad0',
            '#fbf3e4',
            '#dff4df',
            '#eaeffd',
            '#fff0f6',
            '#ffffff',
            '#fbf2ff',
            '#ddccc1',
            '#FCE8E8',
            '#e4e4e4'
        ]
    },
    {
        name: constants.COLOR_SCHEME_FITZGERALD_LIGHT,
        categories: constants.CS_FITZGERALD_CATEGORIES,
        mappings: constants.CS_MAPPING_TO_FITZGERALD,
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
        categories: constants.CS_FITZGERALD_CATEGORIES,
        mappings: constants.CS_MAPPING_TO_FITZGERALD,
        colors: [
            '#ffff6b',
            '#ffb56b',
            '#b5ff6b',
            '#6bb5ff',
            '#ff6bff',
            '#ffffff',
            '#ce6bff',
            '#bf9075',
            '#ff704d',
            '#a3a3a3'
        ]
    },
    {
        name: constants.COLOR_SCHEME_FITZGERALD_DARK,
        categories: constants.CS_FITZGERALD_CATEGORIES,
        mappings: constants.CS_MAPPING_TO_FITZGERALD,
        colors: [
            '#79791F',
            '#804c26',
            '#4c8026',
            '#264c80',
            '#802680',
            '#747474',
            '#602680',
            '#52331f',
            '#80261a',
            '#464646'
        ]
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_VERY_LIGHT,
        categories: constants.CS_GOOSSENS_CATEGORIES,
        colors: ['#fff0f6', '#eaeffd', '#dff4df', '#fafad0', '#fbf3e4']
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_LIGHT,
        categories: constants.CS_GOOSSENS_CATEGORIES,
        colors: ['#fdcae1', '#84b6f4', '#c7f3c7', '#fdfd96', '#ffda89']
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_MEDIUM,
        categories: constants.CS_GOOSSENS_CATEGORIES,
        colors: ['#ff6bff', '#6bb5ff', '#b5ff6b', '#ffff6b', '#ffb56b']
    },
    {
        name: constants.COLOR_SCHEME_GOOSENS_DARK,
        categories: constants.CS_GOOSSENS_CATEGORIES,
        colors: [
            '#802680',
            '#264c80',
            '#4c8026',
            '#79791F',
            '#804c26']
    },
    {
        name: constants.COLOR_SCHEME_MONTESSORI_VERY_LIGHT,
        categories: constants.CS_MONTESSORI_CATEGORIES,
        colors: [
            '#ffffff', // noun
            '#e3f5fa', // article
            '#eaeffd', // adjective
            '#FCE8E8', // verb
            '#dff4df', // preposition
            '#fbf3e4', // adverb
            '#fbf2ff', // pronoun
            '#fff0f6', // conjunction
            '#fbf7e4', // interjection
            '#e4e4e4'  // category
        ],
        customBorders: {
            "CC_NOUN": '#353535'
        }
    },
    {
        name: constants.COLOR_SCHEME_MONTESSORI_LIGHT,
        categories: constants.CS_MONTESSORI_CATEGORIES,
        colors: [
            '#afafaf',
            '#a8e0f0',
            '#a5bbf7',
            '#f4a8a8',
            '#ace3ac',
            '#f2d7a6',
            '#e4a5ff',
            '#ffa5c9',
            '#f2e5a6',
            '#d1d1d1'
        ]
    },
    {
        name: constants.COLOR_SCHEME_MONTESSORI_MEDIUM,
        categories: constants.CS_MONTESSORI_CATEGORIES,
        colors: [
            '#000000',
            '#4ca6d9',
            '#1347ae',
            '#e73a0f',
            '#04bf82',
            '#fd9030',
            '#6118a2',
            '#f1c9d1',
            '#aa996b',
            '#d1d1d1'
        ]
    },
    {
        name: constants.COLOR_SCHEME_MONTESSORI_DARK,
        categories: constants.CS_MONTESSORI_CATEGORIES,
        colors: [
            '#464646',
            '#18728c',
            '#0d3298',
            '#931212',
            '#287728',
            '#BC5800',
            '#7500a7',
            '#a70043',
            '#807351',
            '#747474'
        ]
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

export { constants };
