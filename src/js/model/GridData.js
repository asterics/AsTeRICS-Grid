import {modelUtil} from "../util/modelUtil";
import {GridElement} from "./GridElement";
import Model from "objectmodel"

class GridData extends Model({
    id: String,
    label: [String],
    rowCount: Number,
    gridElements: Model.Array(GridElement)
}) {
    constructor(...args) {
        super(...args);
        this.id = modelUtil.generateId('grid-data')
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
            result.push(new GridData({
                id: item.id,
                label: item.label,
                rowCount: item.rowCount,
                gridElements: GridElement.fromJSON(item.gridElements)
            }));
        });

        return result.length == 1 ? result[0] : result;
    }

    static fromGridListInstance(gridListInstance) { //converts from instance of GridList.js (library) to GridData object model
        var gridData = new GridData({
            rowCount: Number.parseInt(gridListInstance._options.lanes),
            gridElements: []
        });
        gridListInstance.items.forEach(function (item) {
            var id = item.$element.attr('data-id');
            var label = item.$element.attr('data-label');
            gridData.gridElements.push(new GridElement({
                id: id,
                label: label,
                width: item.w,
                height: item.h,
                x: item.x,
                y: item.y
            }));
        });
        return gridData;
    }
}

GridData.defaults({
    id: "", //will be replaced by constructor
    rowCount: 9
});

export {GridData};