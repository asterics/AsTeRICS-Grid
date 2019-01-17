class EncryptedObject {
    constructor(props) {
        let thiz = this;
        Object.keys(props).forEach(key => {
            thiz[key] = props[key];
        });
    }
}
export {EncryptedObject};