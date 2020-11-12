import {modelUtil} from "./modelUtil";
import {GridElement} from "../model/GridElement";
import {i18nService} from "../service/i18nService";
import {GridImage} from "../model/GridImage";
import {GridActionNavigate} from "../model/GridActionNavigate";
import {GridActionSpeak} from "../model/GridActionSpeak";
import {GridActionCollectElement} from "../model/GridActionCollectElement";
import {GridData} from "../model/GridData";

let gridUtil = {};

/**
 * renews all IDs of the grids in the given list of grids while maintaining correct references in other grids (e.g.
 * grid action navigate).
 *
 * @param gridDataList list of grids where IDs should be regenerated
 * @return {[]} list of grids with regenerated IDs
 */
gridUtil.regenerateIDs = function (gridDataList) {
    let replacedIds = {};
    let returnList = [];
    gridDataList.forEach(gridData => {
        let newId = modelUtil.generateId('grid-data');
        replacedIds[gridData.id] = newId;
        gridData._id = gridData.id = newId;
        gridData._rev = null;
    });
    gridDataList.forEach(gridData => {
        let json = JSON.stringify(gridData);
        Object.keys(replacedIds).forEach(oldId => {
            json = json.replace(new RegExp(oldId, 'g'), replacedIds[oldId]);
        });
        returnList.push(JSON.parse(json));
    });
    return {
        grids: returnList,
        idMapping: replacedIds
    };
};

/**
 * sorts a given set of grid elements
 * @param elements
 * @return {*}
 */
gridUtil.sortGridElements = function (elements) {
    if (!elements) {
        return elements;
    }
    return elements.sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
};

/**
 * generates a global grid with elements "home", "back", input field, "backspace" and "clear"
 * @param homeGridId id of the grid where the "home" buttons should navigate to
 * @param locale the locale of the grid to generate, e.g. "de" or "en"
 * @return {GridData}
 */
gridUtil.generateGlobalGrid = function (homeGridId, locale) {
    let width = 0;
    let elementHome = new GridElement({
        width: 1,
        height: 1,
        x: 0,
        y: 0,
        label: i18nService.getTranslationObject('Home // Start', locale),
        image: new GridImage({
            data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48cGF0aCBkPSJNMjgwLjM3IDE0OC4yNkw5NiAzMDAuMTFWNDY0YTE2IDE2IDAgMCAwIDE2IDE2bDExMi4wNi0uMjlhMTYgMTYgMCAwIDAgMTUuOTItMTZWMzY4YTE2IDE2IDAgMCAxIDE2LTE2aDY0YTE2IDE2IDAgMCAxIDE2IDE2djk1LjY0YTE2IDE2IDAgMCAwIDE2IDE2LjA1TDQ2NCA0ODBhMTYgMTYgMCAwIDAgMTYtMTZWMzAwTDI5NS42NyAxNDguMjZhMTIuMTkgMTIuMTkgMCAwIDAtMTUuMyAwek01NzEuNiAyNTEuNDdMNDg4IDE4Mi41NlY0NC4wNWExMiAxMiAwIDAgMC0xMi0xMmgtNTZhMTIgMTIgMCAwIDAtMTIgMTJ2NzIuNjFMMzE4LjQ3IDQzYTQ4IDQ4IDAgMCAwLTYxIDBMNC4zNCAyNTEuNDdhMTIgMTIgMCAwIDAtMS42IDE2LjlsMjUuNSAzMUExMiAxMiAwIDAgMCA0NS4xNSAzMDFsMjM1LjIyLTE5My43NGExMi4xOSAxMi4xOSAwIDAgMSAxNS4zIDBMNTMwLjkgMzAxYTEyIDEyIDAgMCAwIDE2LjktMS42bDI1LjUtMzFhMTIgMTIgMCAwIDAtMS43LTE2LjkzeiIvPjwvc3ZnPg'
        }),
        actions: [new GridActionNavigate({toGridId: homeGridId})]
    });
    let elementBack = new GridElement({
        width: 1,
        height: 1,
        x: 1,
        y: 0,
        label: i18nService.getTranslationObject('Back // Zurück', locale),
        image: new GridImage({
            data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDUwNEMxMTkgNTA0IDggMzkzIDggMjU2UzExOSA4IDI1NiA4czI0OCAxMTEgMjQ4IDI0OC0xMTEgMjQ4LTI0OCAyNDh6bTExNi0yOTJIMjU2di03MC45YzAtMTAuNy0xMy0xNi4xLTIwLjUtOC41TDEyMS4yIDI0Ny41Yy00LjcgNC43LTQuNyAxMi4yIDAgMTYuOWwxMTQuMyAxMTQuOWM3LjYgNy42IDIwLjUgMi4yIDIwLjUtOC41VjMwMGgxMTZjNi42IDAgMTItNS40IDEyLTEydi02NGMwLTYuNi01LjQtMTItMTItMTJ6Ii8+PC9zdmc+'
        }),
        actions: [new GridActionNavigate({toLastGrid: true})]
    });
    let speakAction = new GridActionSpeak();
    if (locale) {
        speakAction.speakLanguage = locale;
    }
    let elementCollect = new GridElement({
        width: Math.max(4, width - 4),
        height: 1,
        x: 2,
        y: 0,
        type: GridElement.ELEMENT_TYPE_COLLECT,
        actions: [speakAction]
    });
    let elementBackspace = new GridElement({
        label: i18nService.getTranslationObject('Delete Word // Wort löschen', locale),
        width: 1,
        height: 1,
        x: 2 + elementCollect.width,
        y: 0,
        image: new GridImage({ //fa backspace
            data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NDAgNTEyIj48cGF0aCBkPSJNNTc2IDY0SDIwNS4yNkE2My45NyA2My45NyAwIDAgMCAxNjAgODIuNzVMOS4zNyAyMzMuMzdjLTEyLjUgMTIuNS0xMi41IDMyLjc2IDAgNDUuMjVMMTYwIDQyOS4yNWMxMiAxMiAyOC4yOCAxOC43NSA0NS4yNSAxOC43NUg1NzZjMzUuMzUgMCA2NC0yOC42NSA2NC02NFYxMjhjMC0zNS4zNS0yOC42NS02NC02NC02NHptLTg0LjY5IDI1NC4wNmM2LjI1IDYuMjUgNi4yNSAxNi4zOCAwIDIyLjYzbC0yMi42MiAyMi42MmMtNi4yNSA2LjI1LTE2LjM4IDYuMjUtMjIuNjMgMEwzODQgMzAxLjI1bC02Mi4wNiA2Mi4wNmMtNi4yNSA2LjI1LTE2LjM4IDYuMjUtMjIuNjMgMGwtMjIuNjItMjIuNjJjLTYuMjUtNi4yNS02LjI1LTE2LjM4IDAtMjIuNjNMMzM4Ljc1IDI1NmwtNjIuMDYtNjIuMDZjLTYuMjUtNi4yNS02LjI1LTE2LjM4IDAtMjIuNjNsMjIuNjItMjIuNjJjNi4yNS02LjI1IDE2LjM4LTYuMjUgMjIuNjMgMEwzODQgMjEwLjc1bDYyLjA2LTYyLjA2YzYuMjUtNi4yNSAxNi4zOC02LjI1IDIyLjYzIDBsMjIuNjIgMjIuNjJjNi4yNSA2LjI1IDYuMjUgMTYuMzggMCAyMi42M0w0MjkuMjUgMjU2bDYyLjA2IDYyLjA2eiIvPjwvc3ZnPg'
        }),
        actions: [new GridActionCollectElement({action: GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD})]
    });
    let elementClear = new GridElement({
        label: i18nService.getTranslationObject('Clear // Leeren', locale),
        width: 1,
        height: 1,
        x: 3 + elementCollect.width,
        y: 0,
        image: new GridImage({ //fa times-circle
            data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDhDMTE5IDggOCAxMTkgOCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzOTMgOCAyNTYgOHptMTIxLjYgMzEzLjFjNC43IDQuNyA0LjcgMTIuMyAwIDE3TDMzOCAzNzcuNmMtNC43IDQuNy0xMi4zIDQuNy0xNyAwTDI1NiAzMTJsLTY1LjEgNjUuNmMtNC43IDQuNy0xMi4zIDQuNy0xNyAwTDEzNC40IDMzOGMtNC43LTQuNy00LjctMTIuMyAwLTE3bDY1LjYtNjUtNjUuNi02NS4xYy00LjctNC43LTQuNy0xMi4zIDAtMTdsMzkuNi0zOS42YzQuNy00LjcgMTIuMy00LjcgMTcgMGw2NSA2NS43IDY1LjEtNjUuNmM0LjctNC43IDEyLjMtNC43IDE3IDBsMzkuNiAzOS42YzQuNyA0LjcgNC43IDEyLjMgMCAxN0wzMTIgMjU2bDY1LjYgNjUuMXoiLz48L3N2Zz4'
        }),
        actions: [new GridActionCollectElement({action: GridActionCollectElement.COLLECT_ACTION_CLEAR})]
    });
    return new GridData({
        label: i18nService.getTranslationObject('Global Grid', locale),
        gridElements: [elementHome, elementBack, elementCollect, elementBackspace, elementClear],
        rowCount: 3
    });
};

/**
 * calculates the x/y offset that is needed for another grid to not interfere with the given global grid
 * @param globalGrid
 * @return {{x: *, y: *}}
 */
gridUtil.getOffset = function (globalGrid) {
    let elements = JSON.parse(JSON.stringify(globalGrid.gridElements));
    let results = [];
    let minValidSum = 100000;
    for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
            if (x + y >= minValidSum) {
                break;
            }
            let valid = elements.reduce((total, element) => {
                return total && (y >= (element.y + element.height) || x >= (element.x + element.width));
            }, true);
            if (valid) {
                minValidSum = x + y;
            }
            results.push({
                x: x,
                y: y,
                sum: x + y,
                valid: valid
            });
        }
    }
    let result = results.filter(result => minValidSum === result.sum && result.valid)[0];
    if (result) {
        return {
            x: result.x,
            y: result.y
        }
    } else {
        return {
            x: globalGrid.getWidth(),
            y: globalGrid.getHeight()
        }
    }
};

gridUtil.getFreeCoordinates = function(gridData) {
    let tempGridData = new GridData({}, gridData);
    let xyMap = {};
    for (let x = 0; x < tempGridData.getWidthWithBounds(); x++) {
        for (let y = 0; y < tempGridData.rowCount; y++) {
            xyMap[x + ' ' + y] = {
                x: x,
                y: y
            }
        }
    }
    tempGridData.gridElements.forEach(gridElement => {
        for (let x = gridElement.x; x < gridElement.width + gridElement.x; x++) {
            for (let y = gridElement.y; y < gridElement.height + gridElement.y; y++) {
                delete xyMap[x + ' ' + y];
            }
        }
    });
    return Object.keys(xyMap).map(key => {
        return {
            x: xyMap[key].x,
            y: xyMap[key].y
        }
    });
};

gridUtil.getFillElements = function (gridData) {
    let freeCoordinates = gridUtil.getFreeCoordinates(gridData);
    return freeCoordinates.map(xy => new GridElement({x: xy.x, y: xy.y}));
};

gridUtil.updateOrAddGridElement = function(gridData, updatedGridElement) {
    updatedGridElement = JSON.parse(JSON.stringify(updatedGridElement));
    gridData = JSON.parse(JSON.stringify(gridData));
    let index = gridData.gridElements.map(el => el.id).indexOf(updatedGridElement.id);

    if (index !== -1) {
        gridData.gridElements[index] = updatedGridElement;
    } else {
        gridData.gridElements.push(updatedGridElement);
    }
    return gridData;
};

/**
 * returns a graph of elements representing the hierarchy of the given grids.
 * @param grids a list of GridData
 * @param removeGridId (optional) ID of grid to remove (e.g. global grid ID)
 * @return {[]} array of objects of type GridNode: {grid: GridData, parents: [GridNode], children: [GridNode]} ordered by
 *         number of links to other nodes (more linked nodes first)
 */
gridUtil.getGraphList = function (grids, removeGridId) {
    grids = grids.filter(g => g.id !== removeGridId);
    let gridGraphList = [];
    let gridGraphMap = {};
    grids.forEach(grid => {
        let parents = grids.filter(g => hasElemNavigatingTo(g.gridElements, grid.id));
        let children = grids.filter(g => getNavigationIds(grid).indexOf(g.id) !== -1);
        let graphListElem = {
            grid: grid,
            parents: parents,
            children: children,
            navCount: parents.length + children.length
        };
        gridGraphList.push(graphListElem);
        gridGraphMap[grid.id] = graphListElem;
    });
    gridGraphList.sort((a, b) => {
        return b.navCount - a.navCount;
    });
    gridGraphList.forEach(elem => {
        elem.parents = elem.parents.map(parent => gridGraphMap[parent.id]);
        elem.children = elem.children.map(child => gridGraphMap[child.id]);
        elem.allRelatives = elem.children.concat(elem.parents.filter(p => elem.children.indexOf(p) === -1));
    });
    return gridGraphList;
};

/**
 * returns a list of all children of a given grid (recursive)
 * @param gridGraphList a graph list returned by gridUtil.getGraphList()
 * @param gridId the ID of the grid to get the children of
 * @param children used internally for recursion, not needed
 * @return {*|*[]}
 */
gridUtil.getAllChildrenRecursive = function (gridGraphList, gridId, children) {
    let allChildren = getAllChildrenRecursive(gridGraphList, gridId, children);
    return allChildren.filter(child => child.id !== gridId);
}

function getAllChildrenRecursive (gridGraphList, gridId, children) {
    let graphElem = gridGraphList.filter(elem => elem.grid.id === gridId)[0];
    children = children || [];
    let newAdded = [];
    graphElem.children.forEach(child => {
        if (children.indexOf(child.grid) === -1) {
            children.push(child.grid);
            newAdded.push(child.grid.id);
        }
    });
    newAdded.forEach(id => {
        children = getAllChildrenRecursive(gridGraphList, id, children);
    });
    return children;
}

function getElemsNavigatingTo(elems, id) {
    return elems.filter(elem => elem.actions.filter(action => action.modelName === GridActionNavigate.getModelName() && action.toGridId === id).length > 0);
}

function hasElemNavigatingTo(elems, id) {
    return getElemsNavigatingTo(elems, id).length > 0;
}

function getNavigationIds(grid) {
    let allNavActions = grid.gridElements.reduce((total, elem) => {
        return total.concat(elem.actions.filter(a => a.modelName === GridActionNavigate.getModelName()));
    }, []);
    return allNavActions.map(a => a.toGridId);
}

export {gridUtil};