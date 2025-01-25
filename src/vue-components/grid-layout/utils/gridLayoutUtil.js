/**
 * util methods for grid layout, e.g. collision-handling, independent of AsTeRICS Grid
 */
let gridLayoutUtil = {};

gridLayoutUtil.DIR_UP = 1;
gridLayoutUtil.DIR_RIGHT = 2;
gridLayoutUtil.DIR_DOWN = 3;
gridLayoutUtil.DIR_LEFT = 4;
gridLayoutUtil.DIRECTIONS_ALL = [gridLayoutUtil.DIR_UP, gridLayoutUtil.DIR_RIGHT, gridLayoutUtil.DIR_DOWN, gridLayoutUtil.DIR_LEFT];
gridLayoutUtil.MAX_GRID_SIZE = 100;

gridLayoutUtil.getWidth = function(gridElements,  gridWidth = 0) {
    if (gridElements.length === 0) {
        return 0;
    }
    let maxElements = Math.max.apply(
        null,
        gridElements.map((el) => el.x + el.width)
    );
    return Math.max(maxElements, gridWidth);
};

gridLayoutUtil.getHeight = function(gridElements,  gridHeight = 0) {
    if (gridElements.length === 0) {
        return 0;
    }
    let maxElements = Math.max.apply(
        null,
        gridElements.map((el) => el.y + el.height)
    );
    return Math.max(maxElements, gridHeight);
};

/**
 * Inserts a duplicate of an element to given elements. Other elements are moved to the right
 * in order to make space for the new element.
 * @param elements
 * @param element the original element that was duplicated
 * @param duplicate
 * @param options
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 * @param options.dontCopy if true, elements aren't copied and the original elements are used (and changed)
 * @returns {*} updated gridElements
 */
gridLayoutUtil.insertDuplicate = function(elements, element, duplicate, options = {}) {
    elements = getCopy(elements, options.dontCopy);
    if (gridLayoutUtil.isFreeSpace(elements, element.x + element.width, element.y, element.width, element.height, options)) {
        // space right?
        duplicate.x = element.x + element.width;
        elements.push(duplicate);
    } else if (gridLayoutUtil.isFreeSpace(elements, element.x, element.y + element.height, element.width, element.height, options)) {
        // space below?
        duplicate.y = element.y + element.height;
        elements.push(duplicate);
    } else if (gridLayoutUtil.isFreeSpace(elements, element.x - element.width, element.y, element.width, element.height, options)) {
        // space left?
        duplicate.x = element.x - element.width;
        elements.push(duplicate);
    } else if (gridLayoutUtil.isFreeSpace(elements, element.x, element.y - element.height, element.width, element.height, options)) {
        // space up?
        duplicate.y = element.y - element.height;
        elements.push(duplicate);
    } else {
        elements.push(duplicate);
        options.dontCopy = true;
        elements = gridLayoutUtil.resolveCollisions(elements, element, options);
    }
    return elements;
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
gridLayoutUtil.moveElements = function(elements, options = {}) {
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
        if (gridLayoutUtil.isFreeSpace(elements,
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
 * @param allElements array of all elements
 * @param moveElements the elements to move
 * @param direction the direction to move, see gridLayoutUtil.DIR_* or 1-4 (UP, RIGHT, DOWN, RIGHT)
 * @param options
 * @param options.outOfBounds if true elements are also moved if they are out of the bounds given by options.gridWidth
 *                            and options.gridHeight
 * @param options.maxMove maximum number of steps to move
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 * @param options.dontCopy if true, elements aren't copied and the original elements are used (and changed)
 * @returns {*}
 */
gridLayoutUtil.moveAsPossible = function(allElements = [], moveElements = [], direction, options = {}) {
    if(!options.dontCopy) {
        allElements = getCopy(allElements);
        // assure moveElements are part of the same (copied) instances from allElements, since they are directly altered below
        moveElements = moveElements.map(moveElem => allElements.find(e => e.id === moveElem.id));
    }
    if (!gridLayoutUtil.DIRECTIONS_ALL.includes(direction)) {
        return allElements;
    }
    let xyDiff = dirToXYDiff(direction);
    sortBeforeMove(moveElements, xyDiff.x, xyDiff.y);

    for (let element of moveElements) {
        let otherElements = allElements.filter(el => el.id !== element.id);
        let step;

        for (step = 1; step <= (options.maxMove || gridLayoutUtil.MAX_GRID_SIZE); step++) {
            if (!gridLayoutUtil.isFreeSpace(otherElements, element.x + xyDiff.x * step, element.y + xyDiff.y * step, element.width, element.height, options)) {
                break;
            }
        }
        element.x += (step - 1) * xyDiff.x;
        element.y += (step - 1) * xyDiff.y;
    }
    return allElements;
};

/**
 * returns true, if the given element size is free space within the given elements
 * @param elements
 * @param x
 * @param y
 * @param width
 * @param height
 * @param options
 * @param options.outOfBounds if false (default) space outside the current dimensions of the grid is considered to be not free,
 *                            otherwise space more right or below the current bounds is considered to be free
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 * @returns {boolean}
 */
gridLayoutUtil.isFreeSpace = function(elements, x, y, width, height, options = {}) {
    if (x < 0 || y < 0) {
        return false;
    }
    options.outOfBounds = options.outOfBounds === true;
    let xMax = gridLayoutUtil.getWidth(elements, options.gridWidth);
    let yMax = gridLayoutUtil.getHeight(elements, options.gridHeight);
    let occupiedMatrix = getOccupiedMatrix(elements, options);
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
 * @param gridElements
 * @param options
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 * @param options.dontCopy if true, elements aren't copied and the original elements are used (and changed)
 * @returns {*}
 */
gridLayoutUtil.normalizeGrid = function(gridElements, options = {}) {
    gridElements = getCopy(gridElements, options.dontCopy);
    for (let gridElement of gridElements) {
        gridElement.width = 1;
        gridElement.height = 1;
    }
    options.outOfBounds = true;
    options.dontCopy = true;
    gridElements = gridLayoutUtil.moveAsPossible(gridElements, gridElements, gridLayoutUtil.DIR_LEFT, options);
    return gridElements;
};

/**
 * resolves collisions based in given grids and a newly added / changed element
 * @param gridElements array of grid elements
 * @param newElement element changed / added (already at new position, or set options.calcNewPos to true)
 * @param options
 * @param options.diff (optional) how much the new element was moved from the original position
 * @param options.diff.x movement of the new element in x-axis
 * @param options.diff.y movement of the new element in y-axis
 * @param options.diff.exact if true newElement was dropped exactly on the x-position, if false between two elements (x-axis)
 *                           if this property is set:
 *                              - exact drops lead to exchange of conflicting element
 *                              - in-between drops lead to moving conflicting elements to the right
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 * @param options.dontCopy if true, elements aren't copied and the original elements are used (and changed)
 * @param options.calcNewPos if true, newElement is still at the original position and new position should be calculated in this method
 * @returns {*}
 */
gridLayoutUtil.resolveCollisions = function(gridElements, newElement, options = {}) {
    gridElements = getCopy(gridElements, options.dontCopy);
    newElement = gridElements.find(e => e.id === newElement.id);
    let diff = options.diff || { x: undefined, y: undefined, exact: undefined, xExact: undefined, yExact: undefined };
    let newPosSwap = options.calcNewPos ? gridLayoutUtil.getSwapPosition(newElement, diff) : getCopy(newElement);
    let testElements = gridElements.filter(e => e.id !== newElement.id).concat(newPosSwap);
    if (!hasCollisions(testElements)) {
        if (options.calcNewPos) {
            newElement.x = newPosSwap.x;
            newElement.y = newPosSwap.y;
        }
        return gridElements;
    }
    if (allConflictsFullyCovered(gridElements, newPosSwap) &&
        Math.abs(diff.x) <= newElement.width &&
        Math.abs(diff.y) <= newElement.height &&
        (diff.x === 0 || diff.y === 0)) {
        // element moved to a neighbour square only in x- or y-axis and fully covers all conflicts
        if (options.calcNewPos) {
            newElement.x = newPosSwap.x;
            newElement.y = newPosSwap.y;
        }
        let conflictElements = getConflictingElements(gridElements, newElement);
        for (let conflict of conflictElements) {
            if (Math.abs(diff.x) > 0) {
                conflict.x += Math.sign(diff.x) * (-1) * newElement.width;
            } else if (Math.abs(diff.y) > 0) {
                conflict.y += Math.sign(diff.y) * (-1) * newElement.height;
            }
        }
    } else if (diff.exact &&
        allConflictsFullyCovered(gridElements, newPosSwap)) {
        // swap same size elements
        if (options.calcNewPos) {
            newElement.x = newPosSwap.x;
            newElement.y = newPosSwap.y;
        }
        let conflictElements = getConflictingElements(gridElements, newElement);
        for (let conflict of conflictElements) { // can only be one
            conflict.x = conflict.x - diff.x;
            conflict.y = conflict.y - diff.y;
        }

    } else {
        // move right and then back
        if (options.calcNewPos) {
            let newPosMoveRight = gridLayoutUtil.getMoveRightPosition(newElement, diff);
            newElement.x = newPosMoveRight.x;
            newElement.y = newPosMoveRight.y;
        }
        let otherElements = gridElements.filter(el => el.id !== newElement.id);
        let moveElements = otherElements.filter(el =>
            el.x >= newElement.x || // elements that are equal or more right on x-axis
            hasCollisions([el, newElement])); // colliding, but more left
        let moveX = Math.max.apply(null, moveElements.map(el => el.width + newElement.width));
        let movedElements = gridLayoutUtil.moveElements(otherElements, {
            moveX: moveX,
            moveElements: moveElements
        });
        // push those back, which don't collide
        options.outOfBounds = true;
        options.maxMove = moveX;
        options.dontCopy = true;
        gridElements = gridLayoutUtil.moveAsPossible(gridElements, movedElements, gridLayoutUtil.DIR_LEFT, options);
    }
    return gridElements;
}

/**
 * returns the position of the element after applying diff
 * @param element
 * @param diff
 * @returns {*|{}}
 */
gridLayoutUtil.getSwapPosition = function(element, diff) {
    let newPos = getCopy(element);
    newPos.x = Math.max(0, newPos.x + diff.x);
    newPos.y = Math.max(0, newPos.y + diff.y);
    return newPos;
}

/**
 * returns the position of the element after applying diff, but
 * x-values between 2 elements are resulting in x+1
 * @param element
 * @param diff
 * @returns {*|{}}
 */
gridLayoutUtil.getMoveRightPosition = function(element, diff) {
    let newPos = getCopy(element);
    newPos.x = Math.max(0, newPos.x + Math.round(diff.xExact + 0.5));
    newPos.y = Math.max(0, newPos.y + diff.y);
    return newPos;
}

gridLayoutUtil.getElementById = function(elements = [], id) {
    return elements.find(el => el.id === id);
}

/**
 * returns a 2-dimensional array where array[x][y] indicates how often this space is occupied. Zero (0) means the space is free.
 * within the given gridElements
 * @param gridElements
 * @param options
 * @param options.gridWidth (optional) standard width of the grid, can be overruled by given grid elements
 * @param options.gridHeight (optional) standard height of the grid, can be overruled by given grid elements
 */
function getOccupiedMatrix(gridElements, options = {}) {
    let occupiedMatrix = getFilled2DimArray(
        gridLayoutUtil.getWidth(gridElements, options.gridWidth),
        gridLayoutUtil.getHeight(gridElements, options.gridHeight),
        0);
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

/**
 * returns true if there are collisions in the given elements (some elements are overlapping)
 * @param elements
 * @returns {boolean}
 */
function hasCollisions(elements) {
    let occupiedMatrix = getOccupiedMatrix(elements);
    let max = 0;
    for (let i = 0; i < occupiedMatrix.length; i++) {
        max = Math.max(max, Math.max.apply(null, occupiedMatrix[i]));
    }
    return max > 1;
}

function getConflictingElements(allElements, testElement) {
    return allElements.filter(el => el.id !== testElement.id && hasCollisions([el, testElement]));
}

/**
 * returns true if all conflicting elements are fully covered by the element
 * @param elements
 * @param element
 * @returns {*}
 */
function allConflictsFullyCovered(elements, element) {
    let conflicts = getConflictingElements(elements, element);
    return conflicts.every(conflict => isFullyCovering(element, conflict));
}

function dirToXYDiff(direction) {
    return {
        x: direction === gridLayoutUtil.DIR_LEFT ? -1 : (direction === gridLayoutUtil.DIR_RIGHT ? 1 : 0),
        y: direction === gridLayoutUtil.DIR_UP ? -1 : (direction === gridLayoutUtil.DIR_DOWN ? 1 : 0)
    }
}

function isFullyCovering(element, otherElement) {
    return element.width >= otherElement.width && element.height >= otherElement.height &&
        element.x <= otherElement.x && element.x + element.width >= otherElement.x + otherElement.width &&
        element.y <= otherElement.y && element.y + element.height >= otherElement.y + otherElement.height;
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

function getFilled2DimArray(firstCount, secondCount, initValue) {
    let array = [];
    for (let i = 0; i < firstCount; i++) {
        let secondArray = new Array(secondCount).fill(initValue);
        array.push(secondArray);
    }
    return array;
}

function getCopy(gridElementsOrElement, dontCopy) {
    if (dontCopy) {
        return gridElementsOrElement;
    }
    if (Array.isArray(gridElementsOrElement)) {
        return gridElementsOrElement.map(elem => getCopyElement(elem));
    }
    return getCopyElement(gridElementsOrElement);
}

function getCopyElement(gridElement = {}) {
    return Object.assign({}, gridElement);
}

export { gridLayoutUtil };
