import {encryptionService} from "./encryptionService";
import {EncryptedObject} from "../../model/EncryptedObject";
import {dataUtil} from "../../util/dataUtil";

jest.mock('../../externals/sjcl');
jest.mock('../../model/EncryptedObject');
jest.mock('./localStorageService');
jest.mock('../../util/dataUtil');

let ID = 'ID';
let REV = 'REV';
let MODEL_NAME = 'MODEL_NAME';

test('encryptionService.encryptObject - Test 1', () => {
    //without password -> base64
    let object = {data: 'testdata'};
    let json = JSON.stringify(object);
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result.encryptedDataBase64).toEqual(btoa(json));
    expect(result.encryptedDataBase64Short).toEqual(btoa(JSON.stringify(dataUtil.getDefaultRemovedPlaceholder())));
});

test('encryptionService.encryptObject - Test 2', () => {
    //without password -> base64
    let object = {
        data: 'testdata',
        modelName: MODEL_NAME,
        id: ID,
        _rev: REV
    };
    let expected = {
        modelName: MODEL_NAME,
        id: ID,
        _id: ID,
        _rev: REV,
        encryptedDataBase64: btoa(JSON.stringify(object)),
        encryptedDataBase64Short: btoa(JSON.stringify(dataUtil.getDefaultRemovedPlaceholder()))
    };
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result).toEqual(expected);
});

test('encryptionService.encryptObject - Test 3', () => {
    //with password -> real encryption
    let object = {data: 'testdata'};
    let json = JSON.stringify(object);
    let encryptionKey = 'mykey';
    let result = encryptionService.encryptObject(object, {encryptionKey: encryptionKey});
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result.encryptedDataBase64).toEqual(encryptionKey + json);
    expect(result.encryptedDataBase64Short).toEqual(encryptionKey + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder()));
});

test('encryptionService.encryptObject - Test 4', () => {
    //with password -> real encryption
    let encryptionKey = 'mykey';
    let object = {
        data: 'testdata',
        modelName: MODEL_NAME,
        id: ID,
        _rev: REV
    };
    let expected = {
        modelName: MODEL_NAME,
        id: ID,
        _id: ID,
        _rev: REV,
        encryptedDataBase64: encryptionKey + JSON.stringify(object),
        encryptedDataBase64Short: encryptionKey + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder())
    };
    let result = encryptionService.encryptObject(object, {encryptionKey: encryptionKey});
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result).toEqual(expected);
});