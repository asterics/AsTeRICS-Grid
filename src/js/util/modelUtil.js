var modelUtil = {};
var idCounter = 1;

modelUtil.generateId = function (prefix) {
    prefix = prefix || "id";
    return prefix + "-" + new Date().getTime() + "-" + (idCounter++);
};

export {modelUtil};