let printService = {};

/**
 * changes grid dimensions for suiting A4 dimensions before native browser print dialog
 */
printService.initPrintHandlers = function () {
    window.addEventListener('beforeprint', () => {
        $('#grid-container').width('27.7cm');
        $('#grid-container').height('19cm');
    });
    window.addEventListener('afterprint', () => {
        $('#grid-container').width('');
        $('#grid-container').height('');
    });
};

export {printService};
