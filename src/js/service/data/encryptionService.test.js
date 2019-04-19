import {encryptionService} from "./encryptionService";
import {EncryptedObject} from "../../model/EncryptedObject";
import {dataUtil} from "../../util/dataUtil";

jest.mock('../../externals/sjcl');
jest.mock('../../model/EncryptedObject');
jest.mock('./localStorageService');
jest.mock('../../util/dataUtil');
jest.mock('../../util/log');

let ID = 'ID';
let REV = 'REV';
let MODEL_NAME = 'MODEL_NAME';
let DEFAULT_PASSWORD = 'DEFAULT_PASSWORD';
let DEFAULT_SALT = 'DEFAULT_SALT';
let DEFAULT_ENC_KEY = DEFAULT_SALT + DEFAULT_PASSWORD;

test('encryptionService.encryptObject - Test 0', () => {
    let object = {data: 'testdata'};
    let json = JSON.stringify(object);
    expect(() => {
        encryptionService.encryptObject(object);
    }).toThrow(); // no encryptions properties set
});

test('encryptionService.encryptObject - Test 1', () => {
    let object = {data: 'testdata'};
    let json = JSON.stringify(object);
    encryptionService.setEncryptionProperties(DEFAULT_PASSWORD, DEFAULT_SALT);
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result.encryptedDataBase64).toEqual(DEFAULT_ENC_KEY + json);
    expect(result.encryptedDataBase64Short).toEqual(DEFAULT_ENC_KEY + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder()));
});

test('encryptionService.encryptObject - Test 2', () => {
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
        encryptedDataBase64: DEFAULT_ENC_KEY + JSON.stringify(object),
        encryptedDataBase64Short: DEFAULT_ENC_KEY + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder())
    };
    encryptionService.setEncryptionProperties(DEFAULT_PASSWORD, DEFAULT_SALT);
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result).toEqual(expected);
});

test('encryptionService.encryptObject - Test 3', () => {
    //with password -> real encryption
    let object = {data: 'testdata'};
    let json = JSON.stringify(object);
    let encryptionKey = 'mykey';
    encryptionService.setEncryptionProperties(encryptionKey, DEFAULT_SALT);
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result.encryptedDataBase64).toEqual(DEFAULT_SALT + encryptionKey + json);
    expect(result.encryptedDataBase64Short).toEqual(DEFAULT_SALT + encryptionKey + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder()));
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
        encryptedDataBase64: DEFAULT_SALT + encryptionKey + JSON.stringify(object),
        encryptedDataBase64Short: DEFAULT_SALT + encryptionKey + JSON.stringify(dataUtil.getDefaultRemovedPlaceholder())
    };
    encryptionService.setEncryptionProperties(encryptionKey, DEFAULT_SALT);
    let result = encryptionService.encryptObject(object);
    expect(result instanceof EncryptedObject).toBeTruthy();
    expect(result).toEqual(expected);
});