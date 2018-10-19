import {dataService} from "./dataService";

function UndoService() {
    var thiz = this;
    var _undoGridDataStack = [];
    var _redoGridDataStack = [];

    /**
     * returns true if undo is possible
     * @return {boolean}
     */
    thiz.canUndo = function () {
        return _undoGridDataStack.length > 0
    };

    /**
     * returns true if redo is possible
     * @return {boolean}
     */
    thiz.canRedo = function () {
        return _redoGridDataStack.length > 0
    };

    /**
     * update grid data and save old state for redo possibility
     * @param newGridData
     * @return {Promise} resolves to true if grid was updated, to false if not (if last state is equal to current state)
     */
    thiz.updateGrid = function (newGridData) {
        return new Promise((resolve) => {
            dataService.getGrid(newGridData.id).then(savedGrid => {
                if (!savedGrid.isEqual(newGridData)) {
                    _undoGridDataStack.push(JSON.parse(JSON.stringify(savedGrid)));
                    _redoGridDataStack = [];
                    dataService.saveGrid(newGridData).then(() => {
                        resolve(true);
                    });
                } else {
                    log.debug('grid not updated, do noting');
                    resolve(false);
                }

            });
        });
    };

    /**
     * undoes to last state
     * @return {*} last gridData which was used for undo
     */
    thiz.doUndo = function () {
        if (this.canUndo()) {
            var undoData = _undoGridDataStack.pop();
            dataService.getGrid(undoData.id).then(savedGrid => {
                _redoGridDataStack.push(JSON.parse(JSON.stringify(savedGrid)));
                dataService.saveGrid(undoData);
            });
            return undoData;
        }
    };

    /**
     * redoes to last state
     * @return {*} last gridData which was used for redo
     */
    thiz.doRedo = function () {
        if (this.canRedo()) {
            var redoData = _redoGridDataStack.pop();
            dataService.getGrid(redoData.id).then(savedGrid => {
                _undoGridDataStack.push(JSON.parse(JSON.stringify(savedGrid)));
                dataService.saveGrid(redoData);
            });
            return redoData;
        }
    };
}

export {UndoService};