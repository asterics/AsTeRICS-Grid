let dataUtil = {};

dataUtil.removeLongPropertyValues = function(object, maxLength, removedPlaceholder) {
    return dataUtil.getDefaultRemovedPlaceholder();
};

dataUtil.getDefaultRemovedPlaceholder = function () {
    return 'shortened';
};

export {dataUtil};