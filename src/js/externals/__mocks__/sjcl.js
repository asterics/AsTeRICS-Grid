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

sjcl.hash = {};
sjcl.hash.sha256 = {};
sjcl.hash.sha256.hash = function(string) {
    return string;
};

sjcl.codec = {};
sjcl.codec.hex = {};
sjcl.codec.hex.fromBits = function(string) {
    return string;
};

export {sjcl};