import { modelUtil } from './modelUtil';
import { GridElement } from '../model/GridElement';
import { i18nService } from '../service/i18nService';
import { GridImage } from '../model/GridImage';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { GridActionCollectElement } from '../model/GridActionCollectElement';
import { GridData } from '../model/GridData';
import { GridElementCollect } from '../model/GridElementCollect.js';
import {constants} from "./constants.js";

let gridUtil = {};

let NAVIGATION_ID_TO_LAST = 'NAVIGATION_ID_TO_LAST';
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
    gridDataList.forEach((gridData) => {
        let newId = modelUtil.generateId('grid-data');
        replacedIds[gridData.id] = newId;
        gridData._id = gridData.id = newId;
        gridData._rev = null;
    });
    gridDataList.forEach((gridData) => {
        let json = JSON.stringify(gridData);
        Object.keys(replacedIds).forEach((oldId) => {
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
 * @param locale the locale of the grid to generate, e.g. "de" or "en"
 * @param options.convertToLowercase if element labels collected in collect element should be converted to lowercase, default: true
 * @return {GridData}
 */
gridUtil.generateGlobalGrid = function (locale, options) {
    options = options || {};
    options.convertToLowercase = options.convertToLowercase !== undefined ? options.convertToLowercase : false;

    let elementHome = new GridElement({
        width: 1,
        height: 1,
        x: 0,
        y: 0,
        image: new GridImage({
            author: constants.ARASAAC_AUTHOR,
            authorURL: constants.ARASAAC_LICENSE_URL,
            url: 'https://api.arasaac.org/api/pictograms/38222?download=false&plural=false&color=true'
        }),
        actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_HOME })]
    });
    let elementBack = new GridElement({
        width: 1,
        height: 1,
        x: 1,
        y: 0,
        image: new GridImage({
            author: constants.ARASAAC_AUTHOR,
            authorURL: constants.ARASAAC_LICENSE_URL,
            url: 'https://api.arasaac.org/api/pictograms/38249?download=false&plural=false&color=true'
        }),
        actions: [new GridActionNavigate({ navType: GridActionNavigate.NAV_TYPES.TO_LAST })]
    });
    let elementCollect = new GridElementCollect({
        width: 10,
        height: 1,
        x: 2,
        y: 0,
        convertToLowercase: options.convertToLowercase
    });
    let elementSpeak = new GridElement({
        width: 1,
        height: 1,
        x: 2 + elementCollect.width,
        y: 0,
        image: new GridImage({
            author: constants.ARASAAC_AUTHOR,
            authorURL: constants.ARASAAC_LICENSE_URL,
            url: 'https://api.arasaac.org/api/pictograms/38221?download=false&plural=false&color=true'
        }),
        actions: [new GridActionCollectElement({ action: GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS })]
    });
    let elementBackspace = new GridElement({
        width: 1,
        height: 1,
        x: 3 + elementCollect.width,
        y: 0,
        image: new GridImage({
            author: constants.ARASAAC_AUTHOR,
            authorURL: constants.ARASAAC_LICENSE_URL,
            url: 'https://api.arasaac.org/api/pictograms/38200?download=false&plural=false&color=true'
        }),
        actions: [new GridActionCollectElement({ action: GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD })]
    });
    let elementClear = new GridElement({
        width: 1,
        height: 1,
        x: 4 + elementCollect.width,
        y: 0,
        image: new GridImage({
            author: constants.ARASAAC_AUTHOR,
            authorURL: constants.ARASAAC_LICENSE_URL,
            url: 'https://api.arasaac.org/api/pictograms/38202?download=false&plural=false&color=true'
        }),
        actions: [new GridActionCollectElement({ action: GridActionCollectElement.COLLECT_ACTION_CLEAR })]
    });
    return new GridData({
        label: i18nService.getTranslationObject(i18nService.t('globalGrid'), locale),
        gridElements: [elementHome, elementBack, elementCollect, elementSpeak, elementBackspace, elementClear],
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
                return total && (y >= element.y + element.height || x >= element.x + element.width);
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
    let result = results.filter((result) => minValidSum === result.sum && result.valid)[0];
    if (result) {
        return {
            x: result.x,
            y: result.y
        };
    } else {
        return {
            x: globalGrid.getWidth(),
            y: globalGrid.getHeight()
        };
    }
};

gridUtil.getFreeCoordinates = function (gridData) {
    let tempGridData = new GridData({}, gridData);
    let xyMap = {};
    for (let x = 0; x < tempGridData.getWidthWithBounds(); x++) {
        for (let y = 0; y < tempGridData.rowCount; y++) {
            xyMap[x + ' ' + y] = {
                x: x,
                y: y
            };
        }
    }
    tempGridData.gridElements.forEach((gridElement) => {
        for (let x = gridElement.x; x < gridElement.width + gridElement.x; x++) {
            for (let y = gridElement.y; y < gridElement.height + gridElement.y; y++) {
                delete xyMap[x + ' ' + y];
            }
        }
    });
    return Object.keys(xyMap).map((key) => {
        return {
            x: xyMap[key].x,
            y: xyMap[key].y
        };
    });
};

gridUtil.getFillElements = function (gridData) {
    let freeCoordinates = gridUtil.getFreeCoordinates(gridData);
    return freeCoordinates.map((xy) => new GridElement({ x: xy.x, y: xy.y }));
};

gridUtil.updateOrAddGridElement = function (gridData, updatedGridElement) {
    updatedGridElement = JSON.parse(JSON.stringify(updatedGridElement));
    gridData = JSON.parse(JSON.stringify(gridData));
    let index = gridData.gridElements.map((el) => el.id).indexOf(updatedGridElement.id);

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
 * @param orderByName if true returned list is ordered by grid name
 * @return {[]} array of objects of type GridNode: {grid: GridData, parents: [GridNode], children: [GridNode]} ordered by
 *         number of links to other nodes (more linked nodes first)
 */
gridUtil.getGraphList = function (grids, removeGridId, orderByName) {
    grids = grids.filter((g) => g.id !== removeGridId);
    let gridGraphList = [];
    let gridGraphMap = {};
    let gridNavMap = {};
    for (let grid of grids) {
        gridNavMap[grid.id] = getNavigationIds(grid);
    }
    grids.forEach((grid) => {
        let parents = grids.filter((g) => gridNavMap[g.id].includes(grid.id));
        let children = grids.filter((g) => gridNavMap[grid.id].indexOf(g.id) !== -1);
        if (parents.length === 1 && gridNavMap[grid.id].indexOf(NAVIGATION_ID_TO_LAST) !== -1) {
            children.push(parents[0]);
        }
        let graphListElem = {
            grid: grid,
            parents: parents,
            children: children,
            navCount: parents.length + children.length
        };
        gridGraphList.push(graphListElem);
        gridGraphMap[grid.id] = graphListElem;
    });
    if (orderByName) {
        gridGraphList.sort((a, b) => {
            return i18nService.getTranslation(a.grid.label).localeCompare(i18nService.getTranslation(b.grid.label));
        });
    } else {
        gridGraphList.sort((a, b) => {
            return b.navCount - a.navCount;
        });
    }

    gridGraphList.forEach((elem) => {
        elem.parents = elem.parents.map((parent) => gridGraphMap[parent.id]);
        elem.children = elem.children.map((child) => gridGraphMap[child.id]);
        elem.allRelatives = elem.children.concat(elem.parents.filter((p) => elem.children.indexOf(p) === -1));
    });
    return gridGraphList;
};

/**
 * returns an array of all possible paths through the grid graph given a start element
 * @param startGraphElem the graph element to start
 * @param paths internal, used for recursion
 * @param currentPath internal, used for recursion
 * @return {*[]|number} an array containing all possible paths through the graph with the given
 *                      start element.
 *                      e.g. [[startElem.grid, childGrid, childOfChild, ...],
 *                            [startElem.grid, otherChild, ...], ...]
 */
gridUtil.getAllPaths = function (startGraphElem, paths, currentPath) {
    if (!startGraphElem) {
        return [];
    }
    paths = paths || [];
    currentPath = currentPath || [];
    if (currentPath.includes(startGraphElem)) {
        paths.push(currentPath);
        return paths;
    }
    currentPath.push(startGraphElem);
    if (startGraphElem.children.length === 0) {
        paths.push(currentPath);
        return paths;
    }
    for (let child of startGraphElem.children) {
        gridUtil.getAllPaths(child, paths, currentPath.concat([]));
    }
    return paths;
}

/**
 * returns a map [gridID] => [shortest path from start elem] for all existing grids that can be reached
 * from startElem
 * @param startGraphElem start element, one that was returned by gridUtil.getGraphList
 * @return {{}}
 */
gridUtil.getIdPathMap = function (startGraphElem) {
    let allPaths = gridUtil.getAllPaths(startGraphElem);
    let idPathMap = {};
    for (let path of allPaths) {
        for (let i = 0; i < path.length; i++) {
            let elem = path[i];
            if (!idPathMap[elem.grid.id] || idPathMap[elem.grid.id].length > i + 1) {
                idPathMap[elem.grid.id] = path.slice(0, i + 1);
            }
        }
    }
    return idPathMap;
}

/**
 * returns a path from one grid to another one.
 * @param gridsOrGraphList array of grids of graphElements (returned by gridUtil.getGraphList)
 * @param fromGridId id of grid to start navigation from
 * @param toGridId id of target grid
 * @param idPathMap optional result of gridUtil.getIdPathMap(fromGridGraphElement) for performance optimization
 * @return {null|*[]} sorted array of grids representing the path, including start and target grid,
 *                    including additional property "toNextElementId" and "toNextElementLabel" with the
 *                    element ID/label which navigates to the next entry in the list.
 */
gridUtil.getGridPath = function (gridsOrGraphList, fromGridId, toGridId, idPathMap) {
    if (!gridsOrGraphList || !gridsOrGraphList.length || !fromGridId || !toGridId) {
        return [];
    }
    let graphList;
    if (gridsOrGraphList[0].children) {
        graphList = gridsOrGraphList;
    } else {
        graphList = gridUtil.getGraphList(gridsOrGraphList);
    }
    let startElem = graphList.filter((elem) => elem.grid.id === fromGridId)[0];
    if (!startElem) {
        return [];
    }
    if (fromGridId === toGridId) {
        return [startElem.grid];
    }
    idPathMap = idPathMap || gridUtil.getIdPathMap(startElem);
    let shortestPath = idPathMap[toGridId] ? idPathMap[toGridId] : null;
    let returnPath = shortestPath ? shortestPath.map((graphElem) => graphElem.grid) : [];
    returnPath = JSON.parse(JSON.stringify(returnPath));
    if (returnPath && returnPath.length > 1) {
        for (let i = 0; i < returnPath.length - 1; i++) {
            let nextId = returnPath[i + 1].id;
            for (let element of returnPath[i].gridElements) {
                for (let action of element.actions) {
                    if (
                        action.modelName === GridActionNavigate.getModelName() &&
                        action.navType === GridActionNavigate.NAV_TYPES.TO_GRID &&
                        action.toGridId === nextId
                    ) {
                        returnPath[i].toNextElementId = element.id;
                        returnPath[i].toNextElementLabel = element.label;
                        break;
                    }
                }
            }
        }
    }
    return returnPath;
};

/**
 * returns a list of all children of a given grid (recursive)
 * @param gridGraphList a graph list returned by gridUtil.getGraphList()
 * @param gridId the ID of the grid to get the children of
 * @return {*|*[]} array of children grid objects
 */
gridUtil.getAllChildrenRecursive = function (gridGraphList, gridId) {
    let allChildren = getAllChildrenRecursive(gridGraphList, gridId);
    return allChildren.filter((child) => child.id !== gridId);
};

/**
 * returns a language which has existing labels in the grid elements within the given array of grids
 * @param gridElements array of grid elements
 * @param preferredLang the language which is preferred
 */
gridUtil.getGridsContentLang = function (grids, preferredLang) {
    if (!grids || !grids.length) {
        return preferredLang;
    }
    let allLangs = grids.reduce((total, grid) => {
        let gridLangs = gridUtil.getGridLangs(grid);
        return total.concat(gridLangs);
    }, []);
    return allLangs.includes(preferredLang) ? preferredLang : allLangs[0];
};

gridUtil.getGridLangs = function(grid) {
    if (!grid || !grid.gridElements || !grid.gridElements.length) {
        return [];
    }
    let langs= grid.gridElements.reduce((total, element) => {
        let labelLangs = Object.keys(element.label).filter((lang) => !!element.label[lang]);
        return total.concat(labelLangs);
    }, []);
    return new Array(...new Set(langs));
};

gridUtil.getGridsLangs = function(grids) {
    let langs = [];
    for (let grid of grids) {
        langs = langs.concat(gridUtil.getGridLangs(grid));
    }
    return new Array(...new Set(langs));
};

/**
 * returns all actions of given type for a grid element
 * @param gridElement
 * @param modelName
 */
gridUtil.getActionsOfType = function (gridElement, modelName) {
    let actions = gridElement ? gridElement.actions : null;
    let relevantActions = actions ? actions.filter(a => a.modelName === modelName) : [];
    return relevantActions;
}

/**
 * merges a grid with the global grid
 * @param grid
 * @param globalGrid
 * @param options.globalGridHeightPercentage the height of the global grid in percentage
 * @returns {*} grid data of the merged grid
 */
gridUtil.mergeGrids = function(grid, globalGrid, options = {}) {
    if (grid && globalGrid && globalGrid.gridElements && globalGrid.gridElements.length > 0) {
        globalGrid = new GridData(JSON.parse(JSON.stringify(globalGrid)));
        grid = new GridData(JSON.parse(JSON.stringify(grid)));
        let autowidth = true;
        let heightPercentage = options.globalGridHeightPercentage
            ? options.globalGridHeightPercentage / 100
            : 0.15;
        let heightFactorNormal = 1;
        let heightFactorGlobal = 1;
        if (globalGrid.getHeight() === 1) {
            heightFactorGlobal = (heightPercentage * grid.rowCount) / (1 - heightPercentage);
            heightFactorNormal = 1 / (grid.rowCount * heightPercentage) - 1 / grid.rowCount;
            heightFactorGlobal = Math.round(heightPercentage * 100);
            heightFactorNormal = Math.round(((1 - heightPercentage) / grid.rowCount) * 100);
        }
        let offset = gridUtil.getOffset(globalGrid);
        let factorGrid = autowidth ? globalGrid.getWidth() - offset.x : 1;
        let factorGlobal = autowidth ? grid.getWidthWithBounds() : 1;
        globalGrid.gridElements.forEach((gridElement) => {
            gridElement.width *= factorGlobal;
            gridElement.x *= factorGlobal;
            if (gridElement.y === 0) {
                gridElement.height *= heightFactorGlobal;
            }
        });
        grid.gridElements.forEach((gridElement) => {
            gridElement.width *= factorGrid;
            gridElement.x *= factorGrid;
            gridElement.x += offset.x * factorGlobal;
            gridElement.y = offset.y * heightFactorGlobal + gridElement.y * heightFactorNormal;
            gridElement.height *= heightFactorNormal;
        });
        grid.rowCount *= heightFactorNormal;
        grid.rowCount += offset.y * heightFactorGlobal;
        grid.gridElements = globalGrid.gridElements.concat(grid.gridElements);
    }
    return grid;
}
/**
 * ensure that all defaults are set within the given GridData object
 * and all contained GridElement objects
 * @param gridData
 * @returns {*}
 */
gridUtil.ensureDefaults = function(gridData) {
    for (let key of Object.keys(GridData.DEFAULTS)) {
        gridData[key] = gridData[key] || GridData.DEFAULTS[key];
    }
    for (let key of Object.keys(GridElement.DEFAULTS)) {
        for (let element of gridData.gridElements) {
            element[key] = element[key] || GridElement.DEFAULTS[key];
        }
    }
    return gridData;
};

function getAllChildrenRecursive(gridGraphList, gridId) {
    let graphElem = gridGraphList.filter((elem) => elem.grid.id === gridId)[0];
    return getAllChildrenRecursiveGraphElement(graphElem).map(graphElem => graphElem.grid);
}

function getAllChildrenRecursiveGraphElement(graphElem, children) {
    children = children || [];
    let newAdded = [];
    graphElem.children.forEach((child) => {
        if (children.indexOf(child) === -1) {
            children.push(child);
            newAdded.push(child);
        }
    });
    newAdded.forEach((elem) => {
        children = getAllChildrenRecursiveGraphElement(elem, children);
    });
    return children;
}

function getNavigationIds(grid) {
    let allNavActions = grid.gridElements.reduce((total, elem) => {
        return total.concat(elem.actions.filter((a) => a.modelName === GridActionNavigate.getModelName()));
    }, []);
    return allNavActions
        .map((a) => {
            if (a.navType === GridActionNavigate.NAV_TYPES.TO_LAST) {
                return NAVIGATION_ID_TO_LAST;
            }
            return a.navType === GridActionNavigate.NAV_TYPES.TO_GRID ? a.toGridId : null;
        })
        .filter((a) => !!a);
}

export { gridUtil };
