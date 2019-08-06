import {modelUtil} from "../util/modelUtil";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";

class EncryptedObject extends Model({
    id: String, //ID of the encrypted object
    modelName: String, //modelName of the encrypted object
    modelVersion: String,
    encryptedDataBase64: [String], //stored object, serialized as JSON, encrypted and afterwards base64 encoded
    encryptedDataBase64Short: [String] //same as encryptedDataBase64, but with removed long values (no binary base64 strings), empty if encryptedDataBase64 === encryptedDataBase64Short for saving storage
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
    modelVersion: constants.MODEL_VERSION
});

export {EncryptedObject};