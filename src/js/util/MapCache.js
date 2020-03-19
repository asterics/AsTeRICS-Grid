import {log} from "./log";

/**
 * simple cache, storing key-value pairs while ensuring that
 * 1) stored values cannot be changed from any other point of execution -> stored as JSON string
 * 2) each returned value is a deep copy of the original value -> also prevents errors of remotely changed objects
 * @constructor
 */
function MapCache() {
    let thiz = this;
    let _cache = {};
    let _objectTypeMap = {};

    /**
     * stores a key-value pair
     * @param key the key, has to be a string
     * @param value the value, any JSON-serializable object
     * @param objectType optional constructor function, if defined the MapCache.get() will return new constructor(value)
     */
    thiz.set = function (key, value, objectType) {
        let firstValue = value instanceof Array && value.length > 1 ? value[0] : value;
        if (typeof key !== 'string') {
            log.warn('cache-key has to be a string, aborting.');
            return;
        }
        if (!value) {
            log.warn('cache-values has to be set, aborting.');
            return;
        }
        if (objectType && typeof objectType !== 'function') {
            log.warn('object type has to be a constructor function or empty, aborting.');
            return;
        }
        if (firstValue && firstValue.isShortVersion) {
            log.debug('not caching model instances only containing short version of data, aborting.');
            return;
        }
        _cache[key] = JSON.stringify(value);
        delete _objectTypeMap[key];
        if (objectType) {
            _objectTypeMap[key] = objectType;
        }
    };

    /**
     * returns a saved value for a key.
     * @param key the key to retrieve from cache
     * @return {*} a deep copy of the original value stored with MapCache.set().
     *         If 'objectType' parameter was set at calling MapCache.set(), the returned value will be new constructor(value)
     *         If 'objectType' parameter was set at calling MapCache.set() and the original value was an array,
     *         the returned value will be [new constructor(originalValue[0]), new constructor(originalValue[1]), ...]
     */
    thiz.get = function (key) {
        if (typeof key !== 'string') {
            log.warn('cache-key has to be a string, aborting.');
            return;
        }
        if (!_cache[key]) {
            return null;
        }
        let value = JSON.parse(_cache[key]);
        let objectType = _objectTypeMap[key];
        let isArray = value instanceof Array;
        return isArray ? value.map(e => instantiate(objectType, e)) : instantiate(objectType, value);
    };

    /**
     * same as .get() but returns data as promise with 1ms timeout. reason: gives Vue.js time to update UI and show e.g.
     * loading spinner, otherwise everything in promise chain is instant if returning data from cache
     * @param key
     * @return {Promise<unknown>}
     */
    thiz.getAsPromise = function (key) {
        let value = thiz.get(key);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(value);
            }, 1)
        });
    };

    /**
     * returns true if the given key is stored in the cache
     * @param key
     * @return {boolean}
     */
    thiz.has = function (key) {
        if (typeof key !== 'string') {
            log.warn('cache-key has to be a string, aborting.');
            return false;
        }
        return !!_cache[key];
    };

    /**
     * removes a single item from cache by key
     * @param key
     */
    thiz.clear = function (key) {
        if (key) {
            delete _cache[key];
            delete _objectTypeMap[key];
        }
    };

    /**
     * removes all items from cache
     */
    thiz.clearAll = function () {
        _cache = {};
        _objectTypeMap = {};
    };

    function instantiate(constructor, param) {
        return constructor ? new constructor(param) : param;
    }
}

export {MapCache};