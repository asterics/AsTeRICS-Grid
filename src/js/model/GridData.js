import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import Model from "objectmodel"
import {InputConfig} from "./InputConfig";

class GridData extends Model({
    id: String,
    modelName: String,
    label: [String],
    rowCount: Number,
    gridElements: Model.Array(GridElement),
    inputConfig: InputConfig
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
        var maxXPos = Math.max.apply(null, this.gridElements.map(el => el.x));
        var elemsMaxX = this.gridElements.filter(elem => elem.x == maxXPos);
        var maxYPos = Math.max.apply(null, elemsMaxX.map(el => el.y));
        if(maxYPos == this.rowCount - 1) {
            var minWidth = Math.min.apply(null, elemsMaxX.map(elem => elem.width));
            var elemsMinWidth = elemsMaxX.filter(elem => elem.width == minWidth);
            console.log(elemsMinWidth);
            return {
                x: (elemsMinWidth[0].width - 1) + maxXPos + 1,
                y: elemsMinWidth[0].y
            };
        } else {
            var finalY = maxYPos + 1;
            var elemsFinalY = this.gridElements.filter(elem => elem.y == finalY);

            var finalX = 0;
            if(elemsFinalY.length > 0) {
                var maxXPos = Math.max.apply(null, elemsFinalY.map(el => el.x));
                console.log(maxXPos);
                var elemsMaxX = elemsFinalY.filter(el => el.x == maxXPos);
                console.log(elemsMaxX);
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
    rowCount: 9,
    inputConfig: new InputConfig()
});

export {GridData};