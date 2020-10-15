import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import {AdditionalGridFile} from "./AdditionalGridFile";
import {GridActionARE} from "./GridActionARE";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {Webradio} from "./Webradio";
import {gridUtil} from "../util/gridUtil";
import {localStorageService} from "../service/data/localStorageService";
import {encryptionService} from "../service/data/encryptionService";
import {i18nService} from "../service/i18nService";

class GridData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    isShortVersion: Boolean, // if true this object represents a non-full short version excluding binary base64 data
    label: [Object, String], //map locale -> translation, e.g. "de" => LabelDE
    locale: [String],
    rowCount: [Number],
    minColumnCount: [Number],
    gridElements: Model.Array(GridElement),
    additionalFiles: [Model.Array(AdditionalGridFile)],
    webRadios: [Model.Array(Webradio)],
    thumbnail: [Object] // map with 2 properties: [data, hash], where "data" is base64 Screenshot data and "hash" is the hash of the grid when the screenshot was made
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridData);
        if (properties) {
            properties.id = properties.id ? properties.id : modelUtil.generateId(GridData.getIdPrefix());
        }
        super(properties);
        this.minColumnCount = properties.minColumnCount || this.getWidth() || localStorageService.getLastGridDimensions().minColumnCount || 4;
        this.rowCount = properties.rowCount || this.getHeight() || localStorageService.getLastGridDimensions().rowCount || 3;
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every(elm => elm.hasSetPosition());
    }

    getHash() {
        let string = "";
        this.gridElements.forEach(e => {
            string += JSON.stringify(e.label) + e.x + e.y;
            if (e.image) {
                string += e.image.data.substring(e.image.data.length - 30);
            }
        });
        return encryptionService.getStringHash(string);
    }

    hasOutdatedThumbnail() {
        return !this.thumbnail || !this.thumbnail.data || this.thumbnail.hash !== this.getHash();
    }

    getWidth() {
        if (this.gridElements.length === 0) {
            return 0;
        }
        return Math.max.apply(null, this.gridElements.map(el => el.x + el.width));
    }

    getHeight() {
        if (this.gridElements.length === 0) {
            return 0;
        }
        return Math.max.apply(null, this.gridElements.map(el => el.y + el.height));
    }

    getWidthWithBounds() {
        return Math.max(this.getWidth(), this.minColumnCount);
    }

    getHeightWithBounds() {
        return Math.max(this.getHeight(), this.rowCount);
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
            }
        }

        let freeCoordinates = gridUtil.getFreeCoordinates(this);
        if (freeCoordinates.length > 0) {
            return freeCoordinates[0];
        }
        return {
            x: maxX,
            y: 0
        }
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
        })
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
     * @return the next / previous elementId this grid contains, the given elementId if the grid has no elements
     */
    getNextElementId(elementId, invertDirection) {
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
        sortedElements = sortedElements.filter(el => el.type === GridElement.ELEMENT_TYPE_NORMAL);
        var ids = sortedElements.map(el => el.id);
        var index = ids.indexOf(elementId);
        if (index === -1) {
            return ids[0];
        }
        var increment = invertDirection ? -1 : 1;
        var newIndex = index + increment;
        newIndex = (newIndex > ids.length - 1) ? 0 : newIndex;
        newIndex = (newIndex < 0) ? ids.length - 1 : newIndex;
        return ids[newIndex]
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
        var filteredFiles = this.additionalFiles.filter(f => f.fileName === fileName);
        return filteredFiles.length > 0 ? filteredFiles[0] : null;
    }

    /**
     * returns any ARE model (=AdditionalGridFile) that is used in any areAction of this grid. If there is no
     * areAction in any gridElement, null is returned.
     * @return {*}
     */
    getAREModel() {
        let areAction = this.getAREFirstAction();
        if (areAction) {
            let filteredFiles = this.additionalFiles.filter(f => f.fileName === areAction.areModelGridFileName);
            return filteredFiles[0];
        }
        return null;
    }

    hasAREModel() {
        return !!this.getAREModel();
    }

    /**
     * returns the first GridActionARE that is found in any gridElement of this grid
     * @return {*}
     */
    getAREFirstAction() {
        let allActions = [];
        this.gridElements.forEach(element => {
            allActions = allActions.concat(element.actions);
        });
        return allActions.filter(a => a.modelName === GridActionARE.getModelName())[0];
    }

    getAREURL() {
        let areAction = this.getAREFirstAction();
        return areAction ? areAction.areURL : null;
    }

    clone() {
        let newGrid = new GridData(this);
        delete newGrid._id;
        delete newGrid._rev;
        newGrid.id = modelUtil.generateId('grid-data');
        Object.keys(this.label).forEach(key => {
            newGrid.label[key] = this.label[key] + ' (Copy)';
        });
        return newGrid;
    }

    static getModelName() {
        return "GridData";
    }

    static getIdPrefix() {
        return 'grid-data';
    }
}

GridData.defaults({
    id: "", //will be replaced by constructor
    modelName: GridData.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    isShortVersion: false,
    additionalFiles: [],
    webRadios: [],
    label: {},
    locale: i18nService.getBrowserLang()
});

export {GridData};