import { modelUtil } from './modelUtil';
import { GridElement } from '../model/GridElement';
import { i18nService } from '../service/i18nService';
import { GridImage } from '../model/GridImage';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { GridActionCollectElement } from '../model/GridActionCollectElement';
import { GridData } from '../model/GridData';
import { GridElementCollect } from '../model/GridElementCollect.js';
import { constants } from './constants.js';
import { GridActionARE } from '../model/GridActionARE';
import { encryptionService } from '../service/data/encryptionService';
import { util } from './util';

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
 * @param options.noDeepCopy if set to true, not deep copy of the input grids will be done before merging. This is better
 *                           for performance, but will change the original object. Make sure that it's not saved to
 *                           database afterwards, if setting noDeepCopy to true
 * @returns {*} grid data of the merged grid
 */
gridUtil.mergeGrids = function(grid, globalGrid, options = {}) {
    if (grid && globalGrid && globalGrid.gridElements && globalGrid.gridElements.length > 0) {
        globalGrid = JSON.parse(JSON.stringify(globalGrid));
        grid = options.noDeepCopy ? grid : JSON.parse(JSON.stringify(grid));
        let autowidth = true;
        let heightPercentage = options.globalGridHeightPercentage
            ? options.globalGridHeightPercentage / 100
            : 0.15;
        let heightFactorNormal = 1;
        let heightFactorGlobal = 1;
        if (gridUtil.getHeight(globalGrid) === 1) {
            heightFactorGlobal = (heightPercentage * grid.rowCount) / (1 - heightPercentage);
            heightFactorNormal = 1 / (grid.rowCount * heightPercentage) - 1 / grid.rowCount;
            heightFactorGlobal = Math.round(heightPercentage * 100);
            heightFactorNormal = Math.round(((1 - heightPercentage) / grid.rowCount) * 100);
        }
        let offset = gridUtil.getOffset(globalGrid);
        let factorGrid = autowidth ? gridUtil.getWidth(globalGrid) - offset.x : 1;
        let factorGlobal = autowidth ? gridUtil.getWidthWithBounds(grid) : 1;
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

gridUtil.getAREFirstAction = function(gridData) {
    let allActions = [];
    gridData.gridElements.forEach((element) => {
        allActions = allActions.concat(element.actions);
    });
    return allActions.filter((a) => a.modelName === GridActionARE.getModelName())[0];
};

gridUtil.getAREModel = function(gridData) {
    let areAction = gridUtil.getAREFirstAction(gridData);
    if (areAction) {
        let filteredFiles = gridData.additionalFiles.filter((f) => f.fileName === areAction.areModelGridFileName);
        return filteredFiles[0];
    }
    return null;
};

gridUtil.getAREURL = function(gridData) {
    let areAction = gridUtil.getAREFirstAction(gridData);
    return areAction ? areAction.areURL : null;
};

gridUtil.hasAREModel = function(gridData) {
    return !!gridUtil.getAREModel(gridData);
};

gridUtil.hasOutdatedThumbnail = function(gridData) {
    return !gridData.thumbnail || !gridData.thumbnail.data || gridData.thumbnail.hash !== gridUtil.getHash(gridData);
};

gridUtil.getHash = function(gridData) {
    let string = '';
    gridData.gridElements.forEach((e) => {
        string += JSON.stringify(e.label) + e.x + e.y;
        if (e.image && (e.image.data || e.image.url)) {
            let temp = e.image.data || e.image.url;
            string += temp.substring(temp.length > 30 ? temp.length - 30 : 0);
        }
    });
    return encryptionService.getStringHash(string);
};

gridUtil.getWidth = function(gridDataOrElements) {
    let gridElements = getGridElements(gridDataOrElements);
    if (gridElements.length === 0) {
        return 0;
    }
    return Math.max.apply(
        null,
        gridElements.map((el) => el.x + el.width)
    );
};

gridUtil.getHeight = function(gridDataOrElements) {
    let gridElements = getGridElements(gridDataOrElements);
    if (gridElements.length === 0) {
        return 0;
    }
    return Math.max.apply(
        null,
        gridElements.map((el) => el.y + el.height)
    );
};

gridUtil.getWidthWithBounds = function(gridDataOrElements) {
    return Math.max(gridUtil.getWidth(gridDataOrElements), gridDataOrElements.minColumnCount ? gridDataOrElements.minColumnCount : 0);
};

gridUtil.getHeightWithBounds = function(gridDataOrElements) {
    return Math.max(gridUtil.getHeight(gridDataOrElements), gridDataOrElements.rowCount ? gridDataOrElements.rowCount : 0);
};

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

/**
 * Duplicates the element with the given ID. Other elements are moved to the right
 * in order to make space for the new element.
 * @param gridData
 * @param elementId
 * @returns {*} gridData including the duplicated element
 */
gridUtil.duplicateElement = function(gridData, elementId) {
    let element = gridData.gridElements.find((el) => el.id === elementId)
    let duplicate = JSON.parse(JSON.stringify(element));
    duplicate.id = modelUtil.generateId(GridElement.ID_PREFIX);
    duplicate.actions = duplicate.actions || [];
    duplicate.actions = duplicate.actions.filter(
        (action) => action.modelName !== GridActionNavigate.getModelName()
    );
    if (gridUtil.isFreeSpace(gridData, element.x + element.width, element.y, element.width, element.height)) {
        // space right?
        duplicate.x = element.x + element.width;
        gridData.gridElements.push(duplicate);
    } else if (gridUtil.isFreeSpace(gridData, element.x, element.y + element.height, element.width, element.height)) {
        // space below?
        duplicate.y = element.y + element.height;
        gridData.gridElements.push(duplicate);
    } else if (gridUtil.isFreeSpace(gridData, element.x - element.width, element.y, element.width, element.height)) {
        // space left?
        duplicate.x = element.x - element.width;
        gridData.gridElements.push(duplicate);
    } else if (gridUtil.isFreeSpace(gridData, element.x, element.y - element.height, element.width, element.height)) {
        // space up?
        duplicate.y = element.y - element.height;
        gridData.gridElements.push(duplicate);
    } else {
        gridData.gridElements.push(duplicate);
        gridUtil.resolveCollisions(gridData, element);
    }
    return gridData;
}

/**
 * moves elements based on the given options
 * @param elements all elements of the grid
 * @param options
 * @param options.moveX how much to move in x-direction
 * @param options.moveY how much to move in y-direction
 * @param options.startX at which x-value moving is started
 * @param options.startY at which y-value moving is started
 * @param options.moveElements elements that should be moved, if specified startX / startY have no effect
 * @returns {*[]} array of moved elements with new x/y values
 */
gridUtil.moveElements = function(elements, options = {}) {
    elements = elements || [];
    options.moveX = options.moveX || 0;
    options.moveY = options.moveY || 0;
    options.startX = options.startX || 0;
    options.startY = options.startY || 0;
    options.moveElements = options.moveElements || elements.filter(elem => elem.x >= options.startX && elem.y >= options.startY);

    // start with correct elements to move,
    // e.g. start with right elements if moving to the right
    sortBeforeMove(options.moveElements, options.moveX, options.moveY);
    for (let moveElement of options.moveElements) {
        if (gridUtil.isFreeSpace(elements,
            moveElement.x + options.moveX,
            moveElement.y + options.moveY,
            moveElement.width,
            moveElement.height,
            {outOfBounds: true})) {
            moveElement.x += options.moveX;
            moveElement.y += options.moveY;
        }
    }
    return options.moveElements;
}

/**
 * moves elements in a specific direction as far as possible (without colliding with another element)
 * @param gridData grid data containing all elements
 * @param elements the elements to move
 * @param direction the direction to move, see constants.DIR_* or 1-4 (UP, RIGHT, DOWN, RIGHT)
 * @param options
 * @param options.outOfBounds if true elements are also moved if they are out of the bounds given by gridData
 * @param options.maxMove maximum number of steps to move
 * @returns {*}
 */
gridUtil.moveAsPossible = function(gridData, elements = [], direction, options = {}) {
    if (!constants.DIRECTIONS_ALL.includes(direction) || !gridData) {
        return gridData;
    }
    let xyDiff = dirToXYDiff(direction);
    sortBeforeMove(elements, xyDiff.x, xyDiff.y);

    for (let element of elements) {
        gridData.gridElements = gridData.gridElements.filter(el => el.id !== element.id);
        let step;

        for (step = 1; step < (options.maxMove || constants.MAX_GRID_SIZE); step++) {
            if (!gridUtil.isFreeSpace(gridData, element.x + xyDiff.x * step, element.y + xyDiff.y * step, element.width, element.height, options)) {
                break;
            }
        }
        element.x += (step - 1) * xyDiff.x;
        element.y += (step - 1) * xyDiff.y;
        gridData.gridElements.push(element);
    }
    return gridData;
};

/**
 * returns true, if the given element size is free space within the given gridData / gridElements
 * @param gridDataOrElements
 * @param x
 * @param y
 * @param width
 * @param height
 * @param options
 * @param options.outOfBounds if false (default) space outside the current dimensions of the grid is considered to be not free,
 *                            otherwise space more right or below the current bounds is considered to be free
 * @returns {boolean}
 */
gridUtil.isFreeSpace = function(gridDataOrElements, x, y, width, height, options = {}) {
    if (x < 0 || y < 0) {
        return false;
    }
    options.outOfBounds = options.outOfBounds === true;
    let xMax = gridUtil.getWidthWithBounds(gridDataOrElements);
    let yMax = gridUtil.getHeightWithBounds(gridDataOrElements);
    let occupiedMatrix = getOccupiedMatrix(gridDataOrElements);
    for (let xi = x; xi < x + width; xi++) {
        for (let yi = y; yi < y + height; yi++) {
            if (isOccupied(occupiedMatrix, xi, yi)) {
                return false;
            }
            if (!options.outOfBounds && (xi < 0 || yi < 0 || xi >= xMax || yi >= yMax)) {
                return false;
            }
        }
    }
    return true;
};

/**
 * normalizes the layout of the grid: (1) all elements are sized to 1/1,
 * (2) gaps are filled (move all items to the left), (3) duplicated IDs are fixed
 * @param gridData
 * @returns {*}
 */
gridUtil.normalizeGrid = function(gridData) {
    let seenIds = [];
    for (let gridElement of gridData.gridElements) {
        gridElement.width = 1;
        gridElement.height = 1;
        if (seenIds.includes(gridElement.id)) {
            gridElement.id = new GridElement().id;
        }
        seenIds.push(gridElement.id);
    }
    gridUtil.moveAsPossible(gridData, gridData.gridElements, constants.DIR_LEFT, { outOfBounds: true });
    return gridData;
};

/**
 * resolves collisions based on a given grid and a newly added / changed element
 * @param gridData data of the grid
 * @param newElement element changed / added (already at new position)
 * @param diff (optional) how much the new element was moved from the original position
 * @param diff.x movement of the new element in x-axis
 * @param diff.y movement of the new element in y-axis
 * @returns {*}
 */
gridUtil.resolveCollisions = function(gridData, newElement, diff = { x: undefined, y: undefined }) {
    if (!hasCollisions(gridData)) {
        return gridData;
    }

    if (diff.x <= newElement.width && diff.y <= newElement.height && (diff.x === 0 || diff.y === 0)) {
        // element moved to a neighbour square only in x- or y-axis
        let conflictElements = getConflictingElements(gridData.gridElements, newElement);
        for (let conflict of conflictElements) {
            if (Math.abs(diff.x) > 0) {
                conflict.x += Math.sign(diff.x) * (-1) * newElement.width;
            } else if (Math.abs(diff.y) > 0) {
                conflict.y += Math.sign(diff.y) * (-1) * newElement.height;
            }
        }
    } else {
        // move all elements to the right
        let otherElements = gridData.gridElements.filter(el => el.id !== newElement.id);
        let movedElements = gridUtil.moveElements(otherElements, {
            moveX: newElement.width,
            startX: newElement.x
        });
        // push those back, which don't collide
        gridUtil.moveElements(gridData.gridElements, {
            moveX: -newElement.width,
            moveElements: movedElements
        });
    }
}

/**
 * returns a 2-dimensional array where array[x][y] indicates how often this space is occupied. Zero (0) means the space is free.
 * within the given gridData / gridElements
 * @param gridDataOrElements
 */
function getOccupiedMatrix(gridDataOrElements) {
    let gridElements = getGridElements(gridDataOrElements);
    let occupiedMatrix = util.getFilled2DimArray(gridUtil.getWidthWithBounds(gridDataOrElements), gridUtil.getHeightWithBounds(gridDataOrElements), 0);
    for (let element of gridElements) {
        for (let i = element.x; i < element.x + element.width; i++) {
            for (let j = element.y; j < element.y + element.height; j++) {
                occupiedMatrix[i][j]++;
            }
        }
    }
    return occupiedMatrix;
}

function isOccupied(matrix, x, y) {
    return !!(matrix[x] && matrix[x][y]);
}

function hasCollisions(gridDataOrElements) {
    let occupiedMatrix = getOccupiedMatrix(gridDataOrElements);
    let max = 0;
    for (let i = 0; i < occupiedMatrix.length; i++) {
        max = Math.max(max, Math.max.apply(null, occupiedMatrix[i]));
    }
    return max > 1;
}

function getConflictingElements(allElements, testElement) {
    return allElements.filter(el => el.id !== testElement.id && hasCollisions([el, testElement]));
}

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

function getGridElements(gridDataOrElements) {
    let gridElements = gridDataOrElements.gridElements ? gridDataOrElements.gridElements : gridDataOrElements;
    if (!gridElements || gridElements.length === 0) {
        return [];
    }
    return gridElements;
}

function dirToXYDiff(direction) {
    return {
        x: direction === constants.DIR_LEFT ? -1 : (direction === constants.DIR_RIGHT ? 1 : 0),
        y: direction === constants.DIR_UP ? -1 : (direction === constants.DIR_DOWN ? 1 : 0)
    }
}

/**
 * sorts elements before moving xDiff / yDiff in order to start moving with the right elements
 * (e.g. moving to the left should start with the most left elements)
 * @param elements
 * @param xDiff
 * @param yDiff
 */
function sortBeforeMove(elements, xDiff, yDiff) {
    elements.sort((a, z) => {
        if (xDiff !== 0) {
            return xDiff * (z.x - a.x);
        }
        return yDiff * (z.y - a.y);
    });
}

export { gridUtil };
