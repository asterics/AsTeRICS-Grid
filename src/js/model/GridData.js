import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import {AdditionalGridFile} from "./AdditionalGridFile";
import Model from "objectmodel"
import {GridActionARE} from "./GridActionARE";

class GridData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    isShortVersion: Boolean, // if true this object represents a non-full short version excluding binary base64 data
    label: [String],
    rowCount: Number,
    gridElements: Model.Array(GridElement),
    additionalFiles: [Model.Array(AdditionalGridFile)]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridData);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every(elm => elm.hasSetPosition());
    }

    /**
     * returns object with x and y keys containing an x/y position where to insert a new element
     * @return {*}
     */
    getNewXYPos() {
        if(!this.gridElements || this.gridElements.length == 0) {
            return {
                x: 0,
                y: 0
            }
        }
        var maxXPos = Math.max.apply(null, this.gridElements.map(el => el.x));
        var elemsMaxX = this.gridElements.filter(elem => elem.x == maxXPos);
        var maxYPos = Math.max.apply(null, elemsMaxX.map(el => el.y));
        if(maxYPos == this.rowCount - 1) {
            var minWidth = Math.min.apply(null, elemsMaxX.map(elem => elem.width));
            var elemsMinWidth = elemsMaxX.filter(elem => elem.width == minWidth);
            return {
                x: (elemsMinWidth[0].width - 1) + maxXPos + 1,
                y: elemsMinWidth[0].y
            };
        } else {
            var elemsMaxYPos = elemsMaxX.filter(el => el.y == maxYPos);
            var finalY = maxYPos + elemsMaxYPos[0].height;
            var elemsFinalY = this.gridElements.filter(elem => elem.y == finalY);

            var finalX = elemsMaxX[elemsMaxX.length - 1].x;
            if(elemsFinalY.length > 0) {
                var maxXPos = Math.max.apply(null, elemsFinalY.map(el => el.x));
                var elemsMaxX = elemsFinalY.filter(el => el.x == maxXPos);
                finalX = elemsMaxX[0].x + elemsMaxX[0].width;
            }
            return {
                x: finalX,
                y: finalY
            };
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
     * returns the next/previous elementId this grid contains, based on a given elementId
     * @param elementId the given elementId
     * @param invertDirection if false, the next id is returned, if true the previous id
     * @return the next / previous elementId this grid contains, the given elementId if the grid has no elements
     */
    getNextElementId(elementId, invertDirection) {
        if(!this.gridElements || this.gridElements.length == 0) {
            return elementId;
        }
        if(this.gridElements.length == 1) {
            return this.this.gridElements[0].id;
        }

        var sortedElements = JSON.parse(JSON.stringify(this.gridElements)).sort((a, b) => {
            if(a.y != b.y) return a.y - b.y;
            return a.x - b.x;
        });
        var ids = sortedElements.map(el => el.id);
        var index = ids.indexOf(elementId);
        if(index == -1) {
            return ids[0];
        }
        var increment = invertDirection ? -1 : 1;
        var newIndex = index + increment;
        newIndex = (newIndex > ids.length - 1) ? 0 : newIndex;
        newIndex = (newIndex < 0) ? ids.length - 1 : newIndex;
        return ids[newIndex]
    }

    /**
     * returns the previous elementId this grid contains, based on a given elementId
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
        if(areAction) {
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

    static fromJSON(jsonData) {
        var result = [];
        var data = modelUtil.getAsObject(jsonData);
        if (!(data instanceof Array)) {
            data = [data];
        }
        data.forEach(function (item) {
            result.push(new GridData(item));
        });

        return result.length == 1 ? result[0] : result;
    }

    static getModelName() {
        return "GridData";
    }
}

GridData.defaults({
    id: "", //will be replaced by constructor
    modelName: GridData.getModelName(),
    modelVersion: modelUtil.getModelVersionString(),
    isShortVersion: false,
    rowCount: 9,
    additionalFiles: []
});

export {GridData};