var constants = {};

constants.ELEMENT_EVENT_ID = "ELEMENT_EVENT_ID";
constants.MODEL_VERSION = '{"major": 2, "minor": 0, "patch": 0}';

constants.LOCAL_NOLOGIN_USERNAME = 'default-user';
constants.USERNAME_REGEX = /^[a-z][a-z0-9_-]{2,50}$/;

constants.VALIDATION_ERROR_REGEX = 'VALIDATION_ERROR_REGEX';
constants.VALIDATION_ERROR_EXISTING = 'VALIDATION_ERROR_EXISTING';
constants.VALIDATION_VALID = 'VALIDATION_VALID';

constants.EVENT_DB_CONNECTION_LOST = 'EVENT_DB_CONNECTION_LOST';
constants.EVENT_DB_PULL_UPDATED = 'EVENT_DB_PULL_UPDATED';
constants.EVENT_DB_SYNC_STATE_CHANGE = 'EVENT_DB_SYNC_STATE_CHANGE';
constants.EVENT_DB_INITIALIZED = 'EVENT_DB_INITIALIZED';
constants.EVENT_DB_CLOSED = 'EVENT_DB_CLOSED';

constants.EVENT_SIDEBAR_OPEN = 'event-sidebar-open'; //start open
constants.EVENT_SIDEBAR_OPENED = 'event-sidebar-opened'; //after sidebar opened
constants.EVENT_SIDEBAR_CLOSE = 'event-sidebar-close';

constants.EVENT_GRID_RESIZE = 'EVENT_GRID_RESIZE';

constants.DB_SYNC_STATE_SYNCINC = 'DB_SYNC_STATE_SYNCINC';
constants.DB_SYNC_STATE_SYNCED = 'DB_SYNC_STATE_SYNCED';
constants.DB_SYNC_STATE_STOPPED = 'DB_SYNC_STATE_STOPPED';
constants.DB_SYNC_STATE_FAIL = 'DB_SYNC_STATE_FAIL';
constants.DB_SYNC_STATE_ONLINEONLY = 'DB_SYNC_STATE_ONLINEONLY';

constants.ENVIRONMENT = '#ASTERICS_GRID_ENV#';
constants.IS_ENVIRONMENT_DEV = constants.ENVIRONMENT === ('#ASTERICS_' + 'GRID_ENV#');
constants.IS_ENVIRONMENT_PROD = !constants.IS_ENVIRONMENT_DEV;

export {constants};