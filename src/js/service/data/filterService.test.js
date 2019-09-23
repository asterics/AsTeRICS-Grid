import {filterService} from "./filterService";
import {modelUtil} from "../../util/modelUtil";
import {InputConfig} from "../../model/InputConfig";
import {MetaData} from "../../model/MetaData";

jest.mock('../../externals/objectmodel');
jest.mock('../../externals/jquery');
jest.mock('./encryptionService');
jest.mock('../../util/log');

let modelVersion = {
    major: 1,
    minor: 0,
    patch: 0
};
let modelVersionV2 = {
    major: 2,
    minor: 0,
    patch: 0
};
let modelVersionString = JSON.stringify(modelVersion);
let modelVersionStringV2 = JSON.stringify(modelVersionV2);

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
    let object = {modelVersion: modelVersionString};
    let exptectedResult = {
        decrypted: true,
        modelVersion: modelVersionString
    };
    expect(filterService.convertDatabaseToLiveObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 4', () => {
    //objects have modelVersion, so they should be decrypted
    let objects = [{anything: true, modelVersion: modelVersionString}, {
        anything2: true,
        modelVersion: modelVersionString
    }];
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


test('filterService.convertDatabaseToLiveObjects - any major v1 to v2', () => {
    let objects = [{modelName: 'anything', modelVersion: modelVersionString}];
    let spy = jest.spyOn(modelUtil, 'getModelVersionString').mockImplementation(() => modelVersionStringV2);
    let props = {
        decrypted: true,
        modelVersion: modelVersionStringV2
    };
    let expectedResult = Object.assign({}, objects[0], props);
    expect(filterService.convertDatabaseToLiveObjects(objects)).toEqual(expectedResult);
    spy.mockRestore();
});

test('filterService.convertDatabaseToLiveObjects - metadata major v1 to v2', () => {
    let metadata = new MetaData();
    metadata.modelVersion = modelVersionString;
    metadata.modelName = MetaData.getModelName();
    metadata.inputConfig = {
        scanAutostart: true,
        scanKey: 100,
        scanKeyName: 'anyKey',
        areEvents: ["1", "2", "3"],
        areURL: 'www.test.at'
    };
    let objects = [JSON.parse(JSON.stringify(metadata))];

    let spy = jest.spyOn(modelUtil, 'getModelVersionString').mockImplementation(() => modelVersionStringV2);
    let result = filterService.convertDatabaseToLiveObjects(objects);
    let resultInputConfig = result.inputConfig;
    let scanConfigSelect = resultInputConfig.scanInputs.filter(e => e.label === InputConfig.SELECT)[0];
    expect(result.modelVersion).toEqual(modelVersionStringV2);
    expect(resultInputConfig.scanAutostart).toEqual(undefined);
    expect(resultInputConfig.scanKey).toEqual(undefined);
    expect(resultInputConfig.scanKeyName).toEqual(undefined);
    expect(resultInputConfig.areEvents).toEqual(undefined);
    expect(resultInputConfig.areURL).toEqual(undefined);
    expect(resultInputConfig.scanAuto).toEqual(metadata.inputConfig.scanAutostart);
    expect(resultInputConfig.scanEnabled).toEqual(metadata.inputConfig.scanAutostart);
    expect(scanConfigSelect.keyCode).toEqual(metadata.inputConfig.scanKey);
    expect(scanConfigSelect.keyName).toEqual(metadata.inputConfig.scanKeyName);
    spy.mockRestore();
});