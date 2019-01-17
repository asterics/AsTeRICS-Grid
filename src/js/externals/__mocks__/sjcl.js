let sjcl = {};

sjcl.encrypt = function(encryptionKey, string) {
    if(encryptionKey) {
        return encryptionKey + string;
    } else {
        return string;
    }
};

sjcl.decrypt = function(encryptionKey, encryptedString) {
    if(encryptionKey) {
        return encryptedString.substring(encryptionKey.length);
    } else {
        return encryptedString;
    }
};

export {sjcl};