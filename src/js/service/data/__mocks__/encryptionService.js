let encryptionService = {};

encryptionService.encryptObject = function(object) {
    object.encrypted = true;
    return object;
};

encryptionService.decryptObjects = function(objects) {
    objects = objects instanceof Array ? objects : [objects];
    objects.forEach(object => {
        object.decrypted = true;
    });
    return objects.length > 1 ? objects: objects[0];
};


export {encryptionService};