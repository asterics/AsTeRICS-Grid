// copied from https://github.com/wbt-vienna/accessibility-info-tree/tree/master/src/js/util

let constants = {};

constants.TAGS_DOCUMENT_ID = 'TAGS_DOCUMENT_ID';
constants.TAG_ROOT_ID = 'EVERYTHING';
constants.TAG_ACCESSIBILITY_ID = 'ACCESSIBILITY';
constants.TAG_META_ID = 'META';
constants.TAG_TYPE_LINK_ID = 'TYPE_LINK';

constants.EVENT_DB_CONNECTION_LOST = 'EVENT_DB_CONNECTION_LOST';
constants.EVENT_DB_PULL_UPDATED = 'EVENT_DB_PULL_UPDATED';
constants.EVENT_DB_UNAUTHORIZED = 'EVENT_DB_UNAUTHORIZED';
constants.EVENT_DB_SYNC_STATE_CHANGE = 'EVENT_DB_SYNC_STATE_CHANGE';
constants.EVENT_DB_INITIALIZED = 'EVENT_DB_INITIALIZED';
constants.EVENT_DB_CLOSED = 'EVENT_DB_CLOSED';
constants.EVENT_DB_DATAMODEL_UPDATE = 'EVENT_DB_DATAMODEL_UPDATE';

module.exports = constants;