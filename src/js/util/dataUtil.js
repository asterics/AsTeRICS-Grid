let dataUtil = {};

let defaultRemovedPlaceholder = '_removed_';
let noTrimProperties = ['thumbnail'];

/**
 * Recursively iterates over all properties of a given object and removes all String values longer than a given threshold.
 * Does not modifiy the original object.
 *
 * @param object the object to process
 * @param maxLength maximum length of the String properties, everything longer is replaced by 'removedPlaceholder' (optional, default: 500)
 * @param removedPlaceholder value that should be used as replacement for too long values (optional, defaults to '_removed_')
 * @return {*} copy of given object with String values that are longer than maxLength replaced by removedPlaceholder
 */
dataUtil.removeLongPropertyValues = function(object, maxLength, removedPlaceholder) {
    if(!object) {
        return object;
    }
    removedPlaceholder = removedPlaceholder === undefined ? defaultRemovedPlaceholder: removedPlaceholder;
    maxLength = maxLength || 500;
    let copy = JSON.parse(JSON.stringify(object));
    Object.keys(copy).forEach(key => {
        if (noTrimProperties.indexOf(key) === -1) {
            copy[key] = shortenObjectInternal(copy[key], maxLength, removedPlaceholder);
        }
    });
    return copy;
};

/**
 * returns the default placeholder that is used for 'removeLongPropertyValues' if no
 * parameter is passed
 * @return {string}
 */
dataUtil.getDefaultRemovedPlaceholder = function() {
    return defaultRemovedPlaceholder;
};

function shortenObjectInternal(object, maxLength, removedPlaceholder) {
    if(!object) {
        return object;
    }
    if(typeof object === 'string' || object instanceof String) {
        if(object.length > maxLength) {
            return removedPlaceholder;
        }
    } else if(object instanceof Array) {
        for(let i = 0; i<object.length; i++) {
            object[i] = shortenObjectInternal(object[i], maxLength, removedPlaceholder);
        }
    } else {
        Object.keys(object).forEach(nextKey => {
            if (noTrimProperties.indexOf(nextKey) === -1) {
                object[nextKey] = shortenObjectInternal(object[nextKey], maxLength, removedPlaceholder);
            }
        });
    }
    return object;
}

export {dataUtil};