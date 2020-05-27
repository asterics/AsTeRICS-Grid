import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import {AdditionalGridFile} from "./AdditionalGridFile";
import {GridActionARE} from "./GridActionARE";
import {constants} from "../util/constants";
import {Model} from "../externals/objectmodel";
import {Webradio} from "./Webradio";
import {i18nService} from "../service/i18nService";
import {GridImage} from "./GridImage";
import {GridActionNavigate} from "./GridActionNavigate";
import {GridActionCollectElement} from "./GridActionCollectElement";
import {GridActionSpeak} from "./GridActionSpeak";

class GridData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    isShortVersion: Boolean, // if true this object represents a non-full short version excluding binary base64 data
    label: [String],
    locale: [String],
    rowCount: Number,
    minColumnCount: [Number],
    gridElements: Model.Array(GridElement),
    additionalFiles: [Model.Array(AdditionalGridFile)],
    webRadios: [Model.Array(Webradio)]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridData);
        if (properties) {
            properties.id = properties.id ? properties.id : modelUtil.generateId(GridData.getIdPrefix());
        }
        super(properties);
        this.minColumnCount = properties.minColumnCount || this.getWidth();
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every(elm => elm.hasSetPosition());
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
     * @return {*}
     */
    getNewXYPos() {
        if (!this.gridElements || this.gridElements.length === 0) {
            return {
                x: 0,
                y: 0
            }
        }
        let yPosCountMap = {};
        this.gridElements.forEach(element => {
            yPosCountMap[element.y] = yPosCountMap[element.y] ? yPosCountMap[element.y] + 1 : 1;
        });
        let minValue = Number.MAX_SAFE_INTEGER;
        let yMinElements = 0;
        Object.keys(yPosCountMap).forEach(key => {
            let value = yPosCountMap[key];
            if (value < minValue) {
                minValue = value;
                yMinElements = parseInt(key);
            }
        });
        let elemsMinElemRow = this.gridElements.filter(elem => elem.y === yMinElements);
        let occupiedX = elemsMinElemRow.reduce((total, elem) => {
            for (let i = elem.x; i < elem.x + elem.width; i++) total.push(i);
            return total;
        }, []);
        for (let x = 0; x < 1000; x++) {
            if (occupiedX.indexOf(x) === -1) {
                return {
                    x: x,
                    y: yMinElements
                }
            }
        }
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
        newGrid.label = this.label + ' (Copy)';
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
    rowCount: 9,
    minColumnCount: 3,
    additionalFiles: [],
    webRadios: []
});

export {GridData};