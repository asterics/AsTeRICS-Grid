import {filterService} from "./filterService";
import {modelUtil} from "../../util/modelUtil";
import {InputConfig} from "../../model/InputConfig";
import {MetaData} from "../../model/MetaData";
import {GridData} from "../../model/GridData";
import {i18nService} from "../i18nService";

jest.mock('../../externals/objectmodel');
jest.mock('../../externals/jquery');
jest.mock('./encryptionService');
jest.mock('../../util/log');
jest.mock('../i18nService');

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
let modelVersionV3 = {
    major: 2,
    minor: 0,
    patch: 0
};
let modelVersionString = JSON.stringify(modelVersion);
let modelVersionStringV2 = JSON.stringify(modelVersionV2);
let modelVersionStringV3= JSON.stringify(modelVersionV3);

modelUtil.getModelVersionString = jest.fn(() => modelVersionString);

test('filterService.convertLiveToDatabaseObjects - Test 1', () => {
    let object = {};
    let exptectedResult = {
        encrypted: true
    };
    expect(filterService.convertLiveToDatabaseObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertLiveToDatabaseObjects - Test 2', () => {
    let objects = [{anything: true}, {anything2: true}];
    let props = {
        encrypted: true
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
    let exptectedResult = {};
    expect(filterService.convertDatabaseToLiveObjects(object)).toEqual(exptectedResult);
});

test('filterService.convertDatabaseToLiveObjects - Test 2', () => {
    //objects have no modelVersion, so the should not be decrypted
    let objects = [{anything: true}, {anything2: true}];
    let props = {};
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
    expect(filterService.convertDatabaseToLiveObjects(objects)).toEqual([expectedResult]);
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
    let objects = JSON.parse(JSON.stringify(metadata));

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

test('filterService.updateDatamodel - metadata major v2 to v3', () => {
    let gridDataV2 = JSON.parse('{"_id":"grid-data-1586352044759-130","_rev":"19-df695d1420967ee10278e969cc6f0e05","id":"grid-data-1586352044759-130","modelName":"GridData","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","isShortVersion":false,"label":"Global Grid","rowCount":5,"minColumnCount":4,"gridElements":[{"id":"grid-element-1586352044754-118","modelName":"GridElement","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","width":1,"height":1,"x":0,"y":0,"label":"Start","image":{"id":"grid-image-1586352044753-116","modelName":"GridImage","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","data":"","author":null,"authorURL":null},"actions":[{"id":"grid-action-speak-custom-1539356976705-32","modelName":"GridActionSpeakCustom","speakLanguage":"de","speakText":"custom text"},{"id":"grid-action-navigate-1586352044753-117","modelName":"GridActionNavigate","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","toGridId":"grid-data-1591606512018-116"}],"type":"ELEMENT_TYPE_NORMAL"},{"id":"grid-element-1586352044756-121","modelName":"GridElement","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","width":1,"height":1,"x":1,"y":0,"label":"Zurück","image":{"id":"grid-image-1586352044755-119","modelName":"GridImage","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","data":"","author":null,"authorURL":null},"actions":[{"id":"grid-action-navigate-1586352044755-120","modelName":"GridActionNavigate","modelVersion":"{\\"major\\": 2, \\"minor\\": 0, \\"patch\\": 0}","toLastGrid":true}],"type":"ELEMENT_TYPE_NORMAL"}],"additionalFiles":[],"webRadios":[]}')
    jest.spyOn(modelUtil, 'getModelVersionObject').mockImplementation(() => modelVersionV2);
    jest.spyOn(modelUtil, 'getModelVersionString').mockImplementation(() => modelVersionStringV3);
    jest.spyOn(i18nService, 'getBrowserLang').mockImplementation(() => 'de');
    let result = filterService.updateDataModel(gridDataV2);
    let startElement = result.gridElements.filter(el => el.id === 'grid-element-1586352044754-118')[0];
    expect(result.modelVersion).toEqual(modelVersionStringV3);
    expect(result.label.de).toEqual("Global Grid");
    expect(startElement.label.de).toEqual("Start");
    expect(startElement.actions[0].speakText.de).toEqual("custom text");
    jest.restoreAllMocks();
});

test('filterService.updateDatamodel - keep array or single object', () => {
    let gridDataV2 = {id: "test"};
    let result1 = filterService.updateDataModel(gridDataV2);
    let result2 = filterService.updateDataModel([gridDataV2]);
    expect(result1.id).toEqual("test");
    expect(result2[0].id).toEqual("test");
});