import { modelUtil } from '../util/modelUtil';
import { GridElement } from './GridElement';
import { AdditionalGridFile } from './AdditionalGridFile';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { Webradio } from './Webradio';
import { gridUtil } from '../util/gridUtil';
import { localStorageService } from '../service/data/localStorageService';

class GridData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    lastUpdateTime: [Number],
    isShortVersion: Boolean, // if true this object represents a non-full short version excluding binary base64 data
    label: [Object, String], //map locale -> translation, e.g. "de" => LabelDE
    rowCount: [Number],
    minColumnCount: [Number],
    gridElements: Model.Array(GridElement),
    additionalFiles: [Model.Array(AdditionalGridFile)],
    webRadios: [Model.Array(Webradio)],
    thumbnail: [Object], // map with 2 properties: [data, hash], where "data" is base64 Screenshot data and "hash" is the hash of the grid when the screenshot was made,
    showGlobalGrid: [Boolean],
    globalGridId: [String]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridData);
        if (properties) {
            properties.id = properties.id ? properties.id : modelUtil.generateId(GridData.getIdPrefix());
        }
        super(properties);
        this.minColumnCount =
            properties.minColumnCount ||
            this.getWidth() ||
            localStorageService.getLastGridDimensions().minColumnCount ||
            4;
        this.rowCount =
            properties.rowCount || this.getHeight() || localStorageService.getLastGridDimensions().rowCount || 3;
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every((elm) => elm.hasSetPosition());
    }

    getWidth() {
        return gridUtil.getWidth(this);
    }

    getHeight() {
        return gridUtil.getHeight(this);
    }

    getWidthWithBounds() {
        return gridUtil.getWidthWithBounds(this);
    }

    getHeightWithBounds() {
        return gridUtil.getHeightWithBounds(this);
    }

    isFull() {
        if (this.gridElements.length === 0) {
            return false;
        }
        let area = this.getWidthWithBounds() * this.getHeightWithBounds();
        let occupied = this.gridElements.reduce((total, current) => {
            return total + current.width * current.height;
        }, 0);
        return area === occupied;
    }

    /**
     * returns object with x and y keys containing an x/y position where to insert a new element
     * @param forBigElement if true an positions is returned that fits for big elements
     * @return {*}
     */
    getNewXYPos(forBigElement) {
        let maxX = this.gridElements.reduce((total, elem) => {
            let totalX = elem.x + elem.width;
            if (elem.y === 0 && totalX > total) {
                total = totalX;
            }
            return total;
        }, 0);
        if (forBigElement) {
            return {
                x: maxX,
                y: 0
            };
        }

        let freeCoordinates = gridUtil.getFreeCoordinates(this);
        if (freeCoordinates.length > 0) {
            return freeCoordinates[0];
        }
        return {
            x: maxX,
            y: 0
        };
    }

    /**
     * returns a new GridElement with given options. Position (x/y) is automatically calculated to fit in the current grid.
     * @param options options for the new GridElement
     * @return {GridElement}
     */
    getNewGridElement(options) {
        options = options || {};
        let xy = this.getNewXYPos();
        options = Object.assign(options, {
            x: xy.x,
            y: xy.y
        });
        return new GridElement(options);
    }

    isEqual(otherGridData) {
        var comp1 = JSON.parse(JSON.stringify(otherGridData));
        var comp2 = JSON.parse(JSON.stringify(this));
        delete comp1._rev;
        delete comp2._rev;
        delete comp1._id;
        delete comp2._id;
        return JSON.stringify(comp1) == JSON.stringify(comp2);
    }

    /**
     * returns the next/previous elementId of element of type GridElement.ELEMENT_TYPE_NORMAL this grid contains, based on a given elementId
     * @param elementId the given elementId
     * @param invertDirection if false, the next id is returned, if true the previous id
     * @param elementType the type of the element
     * @return the next / previous elementId this grid contains, the given elementId if the grid has no elements
     */
    getNextElementId(elementId, invertDirection, elementType) {
        elementType = elementType || GridElement.ELEMENT_TYPE_NORMAL;
        if (!this.gridElements || this.gridElements.length === 0) {
            return elementId;
        }
        if (this.gridElements.length === 1) {
            return this.gridElements[0].id;
        }

        var sortedElements = JSON.parse(JSON.stringify(this.gridElements)).sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
        sortedElements = sortedElements.filter((el) => el.type === elementType);
        var ids = sortedElements.map((el) => el.id);
        var index = ids.indexOf(elementId);
        if (index === -1) {
            return ids[0];
        }
        var increment = invertDirection ? -1 : 1;
        var newIndex = index + increment;
        newIndex = newIndex > ids.length - 1 ? 0 : newIndex;
        newIndex = newIndex < 0 ? ids.length - 1 : newIndex;
        return ids[newIndex];
    }

    /**
     * returns the previous elementId of element of type GridElement.ELEMENT_TYPE_NORMAL this grid contains, based on a given elementId
     * @param elementId the given elementId
     * @return the previous elementId this grid contains, null if there are no gridElements
     */
    getPreviousElementId(elementId) {
        return this.getNextElementId(elementId, true);
    }

    getAdditionalFile(fileName) {
        var filteredFiles = this.additionalFiles.filter((f) => f.fileName === fileName);
        return filteredFiles.length > 0 ? filteredFiles[0] : null;
    }

    hasPredictionElements() {
        for (let element of this.gridElements) {
            if (element.type === GridElement.ELEMENT_TYPE_PREDICTION) {
                return true;
            }
        }
        return false;
    }

    clone() {
        let newGrid = new GridData(this);
        for (let element of newGrid.gridElements) {
            element.id = new GridElement().id;
        }
        delete newGrid._id;
        delete newGrid._rev;
        newGrid.id = modelUtil.generateId('grid-data');
        Object.keys(this.label).forEach((key) => {
            newGrid.label[key] = this.label[key] + ' (Copy)';
        });
        return newGrid;
    }

    static getModelName() {
        return 'GridData';
    }

    static getIdPrefix() {
        return 'grid-data';
    }
}

GridData.DEFAULTS = {
    id: '', //will be replaced by constructor
    modelName: GridData.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    isShortVersion: false,
    additionalFiles: [],
    webRadios: [],
    label: {},
    lastUpdateTime: new Date().getTime(),
    showGlobalGrid: true,
    globalGridId: null
};

GridData.defaults(GridData.DEFAULTS);

export { GridData };
