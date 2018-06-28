import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import Model from "objectmodel"
import {ScanningConfig} from "./ScanningConfig";

class GridData extends Model({
    id: String,
    label: [String],
    rowCount: Number,
    gridElements: Model.Array(GridElement),
    scanningConfig: ScanningConfig
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, GridData);
        super(properties);
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every(elm => elm.hasSetPosition());
    }

    static fromJSON(jsonData) {
        var result = [];
        var data = modelUtil.getAsObject(jsonData);
        if(!(data instanceof Array)) {
            data = [data];
        }
        data.forEach(function (item) {
            result.push(new GridData(item));
        });

        return result.length == 1 ? result[0] : result;
    }
}

GridData.defaults({
    id: "", //will be replaced by constructor
    rowCount: 9,
    scanningConfig: new ScanningConfig()
});

export {GridData};