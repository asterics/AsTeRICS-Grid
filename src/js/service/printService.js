let printService = {};
let gridInstance = null;

printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        if (gridInstance) {
            $('#grid-container').width('27.7cm');
            $('#grid-container').height('19cm');
            gridInstance.autosize();
        }
    });
    window.addEventListener('afterprint', () => {
        if (gridInstance) {
            $('#grid-container').width('');
            $('#grid-container').height('');
            gridInstance.autosize();
        }
    });
};

printService.setGridInstance = function (instance) {
    gridInstance = instance;
}

export {printService};