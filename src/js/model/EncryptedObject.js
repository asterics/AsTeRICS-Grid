import {modelUtil} from "../util/modelUtil";

class EncryptedObject extends Model({
    id: String, //ID of the encrypted object
    modelName: String, //modelName of the encrypted object
    encryptedDataBase64: [String] //stored object, serialized as JSON, encrypted and afterwards base64 encoded
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, EncryptedObject);
        super(properties);
        this.id = this.id || modelUtil.generateId(EncryptedObject.getModelName().toLowerCase());
    }

    static getModelName() {
        return "EncryptedObject";
    }
}

EncryptedObject.defaults({
});

export {EncryptedObject};