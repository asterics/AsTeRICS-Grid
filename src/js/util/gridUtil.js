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
import { gridLayoutUtil } from '../../vue-components/grid-layout/utils/gridLayoutUtil';

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
            x: gridUtil.getWidth(globalGrid),
            y: gridUtil.getHeight(globalGrid)
        };
    }
};

/**
 * returns a list of free coordinates in the given grid
 * @param gridData
 * @returns {{x: *, y: *}[]}
 */
gridUtil.getFreeCoordinates = function (gridData) {
    let tempGridData = new GridData({}, gridData);
    let xyMap = {};
    for (let y = 0; y < tempGridData.getHeightWithBounds(); y++) {
        for (let x = 0; x < tempGridData.getWidthWithBounds(); x++) {
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
 * @param existingPathEndsMap internal, used for recursion, a map for counting how often a specific grid was the
 *                            last grid of an existing path. So map[gridId] === 3 means that in the current calculated
 *                            paths there are 3 paths that have grid with "gridId" as last element
 * @return {*[]|number} an array containing all possible paths through the graph with the given
 *                      start element.
 *                      e.g. [[startElem.grid, childGrid, childOfChild, ...],
 *                            [startElem.grid, otherChild, ...], ...]
 */
gridUtil.getAllPaths = function (startGraphElem, paths, currentPath, existingPathEndsMap = {}) {
    let MAX_PATHS_TO_SAME_GRID = 1;
    if (!startGraphElem) {
        return [];
    }
    paths = paths || [];
    currentPath = currentPath || [];
    if (currentPath.includes(startGraphElem)) {
        addPath();
        return paths;
    }
    currentPath.push(startGraphElem);
    if (startGraphElem.children.length === 0) {
        addPath();
        return paths;
    }
    let lastId = currentPath[currentPath.length - 1].grid.id;
    if (existingPathEndsMap[lastId] >= MAX_PATHS_TO_SAME_GRID) {
        addPath();
        return paths;
    }
    for (let child of startGraphElem.children) {
        gridUtil.getAllPaths(child, paths, currentPath.concat([]), existingPathEndsMap);
    }
    return paths;

    function addPath() {
        paths.push(currentPath);
        let lastId = currentPath[currentPath.length - 1].grid.id;
        existingPathEndsMap[lastId] = existingPathEndsMap[lastId] ? existingPathEndsMap[lastId] + 1 : 1;
    }
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
            let height = gridUtil.getHeightWithBounds(grid);
            heightFactorGlobal = (heightPercentage * height) / (1 - heightPercentage);
            heightFactorNormal = 1 / (height * heightPercentage) - 1 / height;
            heightFactorGlobal = Math.round(heightPercentage * 100);
            heightFactorNormal = Math.round(((1 - heightPercentage) / height) * 100);
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
        string += gridUtil.getElementHash(e, {
            dontHash: true
        });
    });
    return encryptionService.getStringHash(string);
};

/**
 * gets a SHA256 hash of a grid element for identifying it
 *
 * @param element the element to hash
 * @param options
 * @param options.dontHash if true hashing with SHA256 is skipped, a plain string including the characteristics of the element is returned instead
 * @param options.skipPosition if true position values are not included in calculating the hash
 * @returns {string|*}
 */
gridUtil.getElementHash = function(element, options = {}) {
    options.dontHash = options.dontHash || false;
    options.skipPosition = options.skipPosition || false;
    let string = element.id + JSON.stringify(element.label);
    string += element.backgroundColor + element.colorCategory;
    if (!options.skipPosition) {
        string += `${element.x}:${element.y}`;
    }
    if (element.image && (element.image.data || element.image.url)) {
        let temp = element.image.data || element.image.url;
        string += temp.substring(temp.length > 30 ? temp.length - 30 : 0);
    }
    return options.dontHash ? string : encryptionService.getStringHash(string);
}

gridUtil.getWidth = function(gridDataOrElements) {
    let gridElements = getGridElements(gridDataOrElements);
    return gridLayoutUtil.getWidth(gridElements);
};

gridUtil.getHeight = function(gridDataOrElements) {
    let gridElements = getGridElements(gridDataOrElements);
    return gridLayoutUtil.getHeight(gridElements);
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
    if (!gridData) {
        return;
    }
    for (let key of Object.keys(GridData.DEFAULTS)) {
        gridData[key] = gridData[key] === undefined ? GridData.DEFAULTS[key] : gridData[key];
    }
    for (let key of Object.keys(GridElement.DEFAULTS)) {
        for (let element of gridData.gridElements) {
            element[key] = element[key] === undefined ? GridElement.DEFAULTS[key] : element[key];
        }
    }
    return gridData;
};

/**
 * returns a duplicate of the given element, same contents, different id, navigation actions removed
 * @param element the element that should be duplicated
 */
gridUtil.duplicateElement = function(element) {
    let duplicate = JSON.parse(JSON.stringify(element));
    duplicate.id = modelUtil.generateId(GridElement.ID_PREFIX);
    duplicate.actions = duplicate.actions || [];
    duplicate.actions = duplicate.actions.filter(
        (action) => action.modelName !== GridActionNavigate.getModelName()
    );
    return duplicate;
}

gridUtil.duplicateElements = function(elements = []) {
    return elements.map(e => gridUtil.duplicateElement(e));
};

gridUtil.ensureUniqueIds = function(gridElements) {
    let seenIds = [];
    for (let gridElement of gridElements) {
        if (seenIds.includes(gridElement.id)) {
            gridElement.id = new GridElement().id;
        }
        seenIds.push(gridElement.id);
    }
};

/**
 * returns the actual screen size of a single 1x1 element given the actual container size of the whole grid
 * @param containerSize the actual screen size of the container of the whole grid
 * @param gridData
 * @returns {{width: number, height: number}}
 */
gridUtil.getOneElementSize = function(containerSize, gridData) {
    let width = gridUtil.getWidthWithBounds(gridData);
    let height = gridUtil.getHeightWithBounds(gridData);
    return {
        width: containerSize.width / width,
        height: containerSize.height / height
    };
};

/**
 * returns true if elem3 is within the rectangle defined by elem1 and elem2
 * @param elem1
 * @param elem2
 * @param elem3
 * @returns {boolean}
 */
gridUtil.isWithinElements = function(elem1, elem2, elem3) {
    if (!elem1 || !elem2 || !elem3) {
        return false;
    }
    const left = Math.min(elem1.x, elem2.x);
    const right = Math.max(elem1.x, elem2.x);
    const top = Math.min(elem1.y, elem2.y);
    const bottom = Math.max(elem1.y, elem2.y);
    return elem3.x >= left && elem3.x <= right && elem3.y >= top && elem3.y <= bottom;
};

/**
 * returns a list of possible property paths for property transfer mode, e.g. ["hidden", "colorCategory", ...]
 * @returns {any[]}
 */
gridUtil.getAllPropTransferPaths = function() {
    let propKeys = Object.keys(constants.TRANSFER_PROPS);
    return propKeys.map(key => constants.TRANSFER_PROPS[key].path);
}

gridUtil.getPropTransferObjectBase = function() {
    let transferObject = {};
    for (let path of gridUtil.getAllPropTransferPaths()) {
        transferObject[path] = constants.PROP_TRANSFER_DONT_CHANGE;
    }
    return transferObject;
}

gridUtil.getPropTransferObjectAll = function(sourceElement) {
    let transferObject = {};
    for (let path of gridUtil.getAllPropTransferPaths()) {
        transferObject[path] = sourceElement[path];
    }
    return transferObject;
}

gridUtil.getPropTransferObjectAppearance = function(sourceElement) {
    let props = Object.keys(constants.TRANSFER_PROPS).map(key => constants.TRANSFER_PROPS[key]);
    let appearanceProps = props.filter(prop => prop.category === constants.PROP_TRANSFER_CATEGORIES.APPEARANCE);
    let transferObject = gridUtil.getPropTransferObjectBase();
    for (let prop of appearanceProps) {
        transferObject[prop.path] = sourceElement[prop.path];
    }
    return transferObject;
};

gridUtil.getCursorType = function(metadata, defaultCursorType = "default") {
    if (!metadata || !metadata.inputConfig || !metadata.inputConfig.hoverEnabled || !metadata.inputConfig.hoverHideCursor) {
        return defaultCursorType;
    }
    return 'none';
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

function getGridElements(gridDataOrElements) {
    let gridElements = gridDataOrElements.gridElements ? gridDataOrElements.gridElements : gridDataOrElements;
    if (!gridElements || gridElements.length === 0) {
        return [];
    }
    return gridElements;
}

export { gridUtil };
