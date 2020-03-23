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

class GridData extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    isShortVersion: Boolean, // if true this object represents a non-full short version excluding binary base64 data
    label: [String],
    locale: [String],
    rowCount: Number,
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
        this.id = this.id || modelUtil.generateId('grid-data');
    }

    hasSetPositions() {
        return this.gridElements.every(elm => elm.hasSetPosition());
    }

    getWidth() {
        return Math.max.apply(null, this.gridElements.map(el => el.x + el.width));
    }

    getHeight() {
        return Math.max.apply(null, this.gridElements.map(el => el.y + el.height));
    }

    /**
     * returns object with x and y keys containing an x/y position where to insert a new element
     * @return {*}
     */
    getNewXYPos() {
        if (!this.gridElements || this.gridElements.length == 0) {
            return {
                x: 0,
                y: 0
            }
        }
        var maxXPos = Math.max.apply(null, this.gridElements.map(el => el.x));
        var elemsMaxX = this.gridElements.filter(elem => elem.x == maxXPos);
        var maxYPos = Math.max.apply(null, elemsMaxX.map(el => el.y));
        if (maxYPos == this.rowCount - 1) {
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
            if (elemsFinalY.length > 0) {
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

    /**
     * renews all IDs of the grids in the given list of grids while maintaining correct references in other grids (e.g.
     * grid action navigate).
     *
     * @param gridDataList list of grids where IDs should be regenerated
     * @return list of grids with regenerated IDs
     */
    static regenerateIDs(gridDataList) {
        let replacedIds = {};
        let returnList = [];
        gridDataList.forEach(gridData => {
            let newId = modelUtil.generateId('grid-data');
            replacedIds[gridData.id] = newId;
            gridData._id = gridData.id = newId;
            gridData._rev = null;
        });
        gridDataList.forEach(gridData => {
            let json = JSON.stringify(gridData);
            Object.keys(replacedIds).forEach(oldId => {
                json = json.replace(new RegExp(oldId, 'g'), replacedIds[oldId]);
            });
            returnList.push(JSON.parse(json));
        });
        return returnList;
    }

    /**
     * sorts a given set of grid elements
     * @param elements
     * @return {*}
     */
    static sortGridElements(elements) {
        if (!elements) {
            return elements;
        }
        return elements.sort((a, b) => {
            if (a.y !== b.y) return a.y - b.y;
            return a.x - b.x;
        });
    }

    /**
     * generates a global grid with elements "home", "back", input field, "backspace" and "clear"
     * @param width the with to generate
     * @return {GridData}
     */
    static generateGlobalGrid(homeGridId, width) {
        width = width || 0;
        let elementHome = new GridElement({
            width: 1,
            height: 1,
            x: 0,
            y: 0,
            label: i18nService.translate('Home // Start'),
            image: new GridImage({
                data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1NzYgNTEyIj48cGF0aCBkPSJNMjgwLjM3IDE0OC4yNkw5NiAzMDAuMTFWNDY0YTE2IDE2IDAgMCAwIDE2IDE2bDExMi4wNi0uMjlhMTYgMTYgMCAwIDAgMTUuOTItMTZWMzY4YTE2IDE2IDAgMCAxIDE2LTE2aDY0YTE2IDE2IDAgMCAxIDE2IDE2djk1LjY0YTE2IDE2IDAgMCAwIDE2IDE2LjA1TDQ2NCA0ODBhMTYgMTYgMCAwIDAgMTYtMTZWMzAwTDI5NS42NyAxNDguMjZhMTIuMTkgMTIuMTkgMCAwIDAtMTUuMyAwek01NzEuNiAyNTEuNDdMNDg4IDE4Mi41NlY0NC4wNWExMiAxMiAwIDAgMC0xMi0xMmgtNTZhMTIgMTIgMCAwIDAtMTIgMTJ2NzIuNjFMMzE4LjQ3IDQzYTQ4IDQ4IDAgMCAwLTYxIDBMNC4zNCAyNTEuNDdhMTIgMTIgMCAwIDAtMS42IDE2LjlsMjUuNSAzMUExMiAxMiAwIDAgMCA0NS4xNSAzMDFsMjM1LjIyLTE5My43NGExMi4xOSAxMi4xOSAwIDAgMSAxNS4zIDBMNTMwLjkgMzAxYTEyIDEyIDAgMCAwIDE2LjktMS42bDI1LjUtMzFhMTIgMTIgMCAwIDAtMS43LTE2LjkzeiIvPjwvc3ZnPg'
            }),
            actions: [new GridActionNavigate({toGridId: homeGridId})]
        });
        let elementBack = new GridElement({
            width: 1,
            height: 1,
            x: 1,
            y: 0,
            label: i18nService.translate('Back // Zurück'),
            image: new GridImage({
                data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDUwNEMxMTkgNTA0IDggMzkzIDggMjU2UzExOSA4IDI1NiA4czI0OCAxMTEgMjQ4IDI0OC0xMTEgMjQ4LTI0OCAyNDh6bTExNi0yOTJIMjU2di03MC45YzAtMTAuNy0xMy0xNi4xLTIwLjUtOC41TDEyMS4yIDI0Ny41Yy00LjcgNC43LTQuNyAxMi4yIDAgMTYuOWwxMTQuMyAxMTQuOWM3LjYgNy42IDIwLjUgMi4yIDIwLjUtOC41VjMwMGgxMTZjNi42IDAgMTItNS40IDEyLTEydi02NGMwLTYuNi01LjQtMTItMTItMTJ6Ii8+PC9zdmc+'
            }),
            actions: [new GridActionNavigate({toLastGrid: true})]
        });
        let elementCollect = new GridElement({
            width: Math.max(4, width - 4),
            height: 1,
            x: 2,
            y: 0,
            type: GridElement.ELEMENT_TYPE_COLLECT
        });
        let elementBackspace = new GridElement({
            label: i18nService.translate('Delete Word // Wort löschen'),
            width: 1,
            height: 1,
            x: 2 + elementCollect.width,
            y: 0,
            image: new GridImage({ //fa backspace
                data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NDAgNTEyIj48cGF0aCBkPSJNNTc2IDY0SDIwNS4yNkE2My45NyA2My45NyAwIDAgMCAxNjAgODIuNzVMOS4zNyAyMzMuMzdjLTEyLjUgMTIuNS0xMi41IDMyLjc2IDAgNDUuMjVMMTYwIDQyOS4yNWMxMiAxMiAyOC4yOCAxOC43NSA0NS4yNSAxOC43NUg1NzZjMzUuMzUgMCA2NC0yOC42NSA2NC02NFYxMjhjMC0zNS4zNS0yOC42NS02NC02NC02NHptLTg0LjY5IDI1NC4wNmM2LjI1IDYuMjUgNi4yNSAxNi4zOCAwIDIyLjYzbC0yMi42MiAyMi42MmMtNi4yNSA2LjI1LTE2LjM4IDYuMjUtMjIuNjMgMEwzODQgMzAxLjI1bC02Mi4wNiA2Mi4wNmMtNi4yNSA2LjI1LTE2LjM4IDYuMjUtMjIuNjMgMGwtMjIuNjItMjIuNjJjLTYuMjUtNi4yNS02LjI1LTE2LjM4IDAtMjIuNjNMMzM4Ljc1IDI1NmwtNjIuMDYtNjIuMDZjLTYuMjUtNi4yNS02LjI1LTE2LjM4IDAtMjIuNjNsMjIuNjItMjIuNjJjNi4yNS02LjI1IDE2LjM4LTYuMjUgMjIuNjMgMEwzODQgMjEwLjc1bDYyLjA2LTYyLjA2YzYuMjUtNi4yNSAxNi4zOC02LjI1IDIyLjYzIDBsMjIuNjIgMjIuNjJjNi4yNSA2LjI1IDYuMjUgMTYuMzggMCAyMi42M0w0MjkuMjUgMjU2bDYyLjA2IDYyLjA2eiIvPjwvc3ZnPg'
            }),
            actions: [ new GridActionCollectElement({action: GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD})]
        });
        let elementClear = new GridElement({
            label: i18nService.translate('Clear // Leeren'),
            width: 1,
            height: 1,
            x: 3 + elementCollect.width,
            y: 0,
            image: new GridImage({ //fa times-circle
                data: 'data:image/svg+xml;base64,' + 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNMjU2IDhDMTE5IDggOCAxMTkgOCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzOTMgOCAyNTYgOHptMTIxLjYgMzEzLjFjNC43IDQuNyA0LjcgMTIuMyAwIDE3TDMzOCAzNzcuNmMtNC43IDQuNy0xMi4zIDQuNy0xNyAwTDI1NiAzMTJsLTY1LjEgNjUuNmMtNC43IDQuNy0xMi4zIDQuNy0xNyAwTDEzNC40IDMzOGMtNC43LTQuNy00LjctMTIuMyAwLTE3bDY1LjYtNjUtNjUuNi02NS4xYy00LjctNC43LTQuNy0xMi4zIDAtMTdsMzkuNi0zOS42YzQuNy00LjcgMTIuMy00LjcgMTcgMGw2NSA2NS43IDY1LjEtNjUuNmM0LjctNC43IDEyLjMtNC43IDE3IDBsMzkuNiAzOS42YzQuNyA0LjcgNC43IDEyLjMgMCAxN0wzMTIgMjU2bDY1LjYgNjUuMXoiLz48L3N2Zz4'
            }),
            actions: [new GridActionCollectElement({action: GridActionCollectElement.COLLECT_ACTION_CLEAR})]
        });
        let globalGrid = new GridData({
            label: 'Global Grid',
            gridElements: [elementHome, elementBack, elementCollect, elementBackspace, elementClear]
        });
        return globalGrid;
    }

    /**
     * calculates the x/y offset that is needed for another grid to not interfere with the given global grid
     * @param globalGrid
     * @return {{x: *, y: *}}
     */
    static getOffset(globalGrid) {
        let elements = JSON.parse(JSON.stringify(globalGrid.gridElements));
        let results = [];
        let minValidSum = 100000;
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                if (x + y >= minValidSum) {
                    break;
                }
                let valid = elements.reduce((total, element) => {
                    return total && (y >= (element.y + element.height) || x >= (element.x + element.width));
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
        let result = results.filter(result => minValidSum === result.sum && result.valid)[0];
        if (result) {
            return {
                x: result.x,
                y: result.y
            }
        } else {
            return {
                x: globalGrid.getWidth(),
                y: globalGrid.getHeight()
            }
        }
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
    additionalFiles: [],
    webRadios: []
});

export {GridData};