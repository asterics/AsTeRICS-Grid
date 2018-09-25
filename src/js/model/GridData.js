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