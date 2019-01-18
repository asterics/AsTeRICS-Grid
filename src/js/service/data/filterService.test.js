import {filterService} from "./filterService";
import {modelUtil} from "../../util/modelUtil";
import {encryptionService} from "./encryptionService";

let modelVersion = {
    major: 1,
    minor: 0,
    patch: 0
};
let modelVersionString = JSON.stringify(modelVersion);

jest.mock('./encryptionService');
jest.mock('../../util/log');
modelUtil.getModelVersionString = jest.fn(() => modelVersionString);

test('filterService.convertLiveToDatabaseObjects - Test 1', () => {
    let object = {};
    let exptectedResult = {
        encrypted: true,
        modelVersion: modelVersionString
    };
    expect(filterService.convertLiveToDatabaseObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertLiveToDatabaseObjects - Test 2', () => {
    let objects = [{anything: true}, {anything2: true}];
    let props = {
        encrypted: true,
        modelVersion: modelVersionString
    };
    let expectedResult = [Object.assign({}, props, objects[0]), Object.assign({}, props, objects[1])];
    expect(filterService.convertLiveToDatabaseObjects(objects)).toEqual(expectedResult);
});

test('filterService.convertLiveToDatabaseObjects - Test 3', () => {
    let objects = null;
    expect(filterService.convertLiveToDatabaseObjects(objects)).toEqual(null);
});

test('filterService.convertDatabaseToLiveObjects - Test 1', () => {
    //objects have no modelVersion, so the should not be decrypted
    let object = {};
    let exptectedResult = {
        modelVersion: modelVersionString
    };
    expect(filterService.convertDatabaseToLiveObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 2', () => {
    //objects have no modelVersion, so the should not be decrypted
    let objects = [{anything: true}, {anything2: true}];
    let props = {
        modelVersion: modelVersionString
    };
    let expectedResult = [Object.assign({}, props, objects[0]), Object.assign({}, props, objects[1])];
    expect(filterService.convertDatabaseToLiveObjects(objects)).toEqual(expectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 3', () => {
    //object has modelVersion, so it should be decrypted
    let object = { modelVersion: modelVersionString};
    let exptectedResult = {
        decrypted: true,
        modelVersion: modelVersionString
    };
    expect(filterService.convertDatabaseToLiveObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 4', () => {
    //objects have modelVersion, so they should be decrypted
    let objects = [{anything: true, modelVersion: modelVersionString}, {anything2: true, modelVersion: modelVersionString}];
    let props = {
        decrypted: true,
        modelVersion: modelVersionString
    };
    let expectedResult = [Object.assign({}, props, objects[0]), Object.assign({}, props, objects[1])];
    expect(filterService.convertDatabaseToLiveObjects(objects)).toEqual(expectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 5', () => {
    let objects = null;
    expect(filterService.convertDatabaseToLiveObjects(objects)).toEqual(null);
});
