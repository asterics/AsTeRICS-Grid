import { gridUtil } from './gridUtil.js';
import {GridActionNavigate} from "../model/GridActionNavigate.js";

jest.mock('../service/i18nService', () => jest.fn());
jest.mock('../externals/objectmodel');
jest.mock('../model/GridActionNavigate');
jest.mock('../model/GridElement');

let NAV_CONSTANTS = {
    TO_LAST: "TO_LAST",
    TO_HOME: "TO_HOME"
}

test('gridUtil.getGraphList - Test 1 - circular dependencies', () => {
    let grids = [getGrid(1, [2]), getGrid(2, [1])];
    let graphList = gridUtil.getGraphList(grids);
    let result1 = graphList.filter(elem => elem.grid.id === 1)[0];
    let result2 = graphList.filter(elem => elem.grid.id === 2)[0];
    expect(result1.children.length).toEqual(1);
    expect(result2.children.length).toEqual(1);
    expect(result1.parents.length).toEqual(1);
    expect(result2.parents.length).toEqual(1);
    expect(result1.parents[0].grid.id).toEqual(2);
    expect(result1.children[0].grid.id).toEqual(2);
});

test('gridUtil.getGraphList - Test 2 - normal tree', () => {
    let grids = [getGrid(1, [2,3]), getGrid(2, [4,5]), getGrid(3, []), getGrid(4, []), getGrid(5, [])];
    let graphList = gridUtil.getGraphList(grids);
    let result1 = graphList.filter(elem => elem.grid.id === 1)[0];
    let result2 = graphList.filter(elem => elem.grid.id === 2)[0];
    let result3 = graphList.filter(elem => elem.grid.id === 3)[0];
    let result4 = graphList.filter(elem => elem.grid.id === 4)[0];
    expect(result1.children.length).toEqual(2);
    expect(result2.children.length).toEqual(2);
    expect(result3.children.length).toEqual(0);
    expect(result1.parents.length).toEqual(0);
    expect(result2.parents.length).toEqual(1);
    expect(result3.parents.length).toEqual(1);
    expect(result4.parents.length).toEqual(1);
});

test('gridUtil.getGraphList - Test 2 - independent grids', () => {
    let grids = [getGrid(1, [2,3]), getGrid(10, [11,12])];
    let graphList = gridUtil.getGraphList(grids);
    let result1 = graphList.filter(elem => elem.grid.id === 1)[0];
    let result2 = graphList.filter(elem => elem.grid.id === 10)[0];
    expect(result1.children.length).toEqual(0);
    expect(result2.children.length).toEqual(0);
    expect(result1.parents.length).toEqual(0);
    expect(result2.parents.length).toEqual(0);
});

test('gridUtil.getAllChildrenRecursive - Test 1 - independent grids', () => {
    let grids = [getGrid(1, [2,3]), getGrid(10, [11,12])];
    let graphList = gridUtil.getGraphList(grids);
    let children1 = gridUtil.getAllChildrenRecursive(graphList, 1);
    let children2 = gridUtil.getAllChildrenRecursive(graphList, 10);
    expect(children1.length).toEqual(0);
    expect(children2.length).toEqual(0);
});

test('gridUtil.getAllChildrenRecursive - Test 2 - normal tree', () => {
    let grids = [getGrid(1, [2,3]), getGrid(2, [4,5]), getGrid(3, []), getGrid(4, []), getGrid(5, [])];
    let graphList = gridUtil.getGraphList(grids);
    let children1 = gridUtil.getAllChildrenRecursive(graphList, 1);
    let children2 = gridUtil.getAllChildrenRecursive(graphList, 2);
    expect(children1.length).toEqual(4);
    [2,3,4,5].forEach(n => expect(children1.map(e => e.id)).toContain(n));
    expect(children2.length).toEqual(2);
});

test('gridUtil.getAllChildrenRecursive - Test 3 - circular', () => {
    let grids = [getGrid(1, [2]), getGrid(2, [1])];
    let graphList = gridUtil.getGraphList(grids);
    let children1 = gridUtil.getAllChildrenRecursive(graphList, 1);
    let children2 = gridUtil.getAllChildrenRecursive(graphList, 2);
    expect(children1.length).toEqual(1);
    expect(children2.length).toEqual(1);
});

test('gridUtil.getAllChildrenRecursive - Test 3 - linear', () => {
    let grids = [getGrid(1, [2]), getGrid(2, [3]), getGrid(3, [])];
    let graphList = gridUtil.getGraphList(grids);
    let children1 = gridUtil.getAllChildrenRecursive(graphList, 1);
    expect(children1.length).toEqual(2);
});

test('gridUtil.getPath - Test 1 - single elem', () => {
    let grids = [getGrid(1, [2])];
    let graphList = gridUtil.getGraphList(grids);
    let path = gridUtil.getGridPath(graphList, 1, 1);
    expect(path.length).toEqual(1);
    expect(path[0].id).toEqual(1);
});

test('gridUtil.getPath - Test 1b - pass grids', () => {
    let grids = [getGrid(1, [2])];
    let path = gridUtil.getGridPath(grids, 1, 1);
    expect(path.length).toEqual(1);
    expect(path[0].id).toEqual(1);
});

test('gridUtil.getPath - Test 2 - single row', () => {
    let grids = [getGrid(1, [2]), getGrid(2, [3]), getGrid(3, [])];
    let graphList = gridUtil.getGraphList(grids);
    let path = gridUtil.getGridPath(graphList, 1, 3);
    expect(path.length).toEqual(3);
    expect(path[0].id).toEqual(1);
    expect(path[1].id).toEqual(2);
    expect(path[2].id).toEqual(3);
});

test('gridUtil.getPath - Test 3 - tree', () => {
    let grids = [getGrid(1, [2,3]), getGrid(2, []), getGrid(3, [4,5]), getGrid(4, []), getGrid(5, [])];
    let graphList = gridUtil.getGraphList(grids);
    let path = gridUtil.getGridPath(graphList, 1, 5);
    expect(path.length).toEqual(3);
    expect(path[0].id).toEqual(1);
    expect(path[1].id).toEqual(3);
    expect(path[2].id).toEqual(5);
});

test('gridUtil.getPath - Test 4 - circular', () => {
    let grids = [getGrid(1, [2]), getGrid(2, [3]), getGrid(3, [1])];
    let graphList = gridUtil.getGraphList(grids);
    let path = gridUtil.getGridPath(graphList, 3, 2);
    expect(path.length).toEqual(3);
    expect(path[0].id).toEqual(3);
    expect(path[1].id).toEqual(1);
    expect(path[2].id).toEqual(2);
});

// TODO uncomment if "shortest path" is implemented some day
/*test('gridUtil.getPath - Test 2 - two paths', () => {
    let grids = [getGrid(1, [2,3]), getGrid(2, [3]), getGrid(3, [])];
    let graphList = gridUtil.getGraphList(grids);
    let path = gridUtil.getGridPath(graphList, 1, 3);
    expect(path.length).toEqual(2);
    expect(path[0].id).toEqual(1);
    expect(path[1].id).toEqual(3);
});*/

function getGrid(id, navigateToList) {
    let elements = [];
    for (let navId of navigateToList) {
        elements.push({
            id: navId,
            actions: [
                {
                    modelName: 'GridActionNavigate',
                    toLastGrid: navId === NAV_CONSTANTS.TO_LAST,
                    toGridId: [NAV_CONSTANTS.TO_LAST, NAV_CONSTANTS.TO_HOME].includes(navId) ? undefined : navId
                }
            ]
        })
    }
    return {
        id: id,
        gridElements: elements
    }
}