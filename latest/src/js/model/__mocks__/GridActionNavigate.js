let GridActionNavigate = {};

GridActionNavigate.extend = () => {
    return null;
};

GridActionNavigate.getModelName = () => {
    return 'GridActionNavigate'
}

GridActionNavigate.NAV_TYPES = {
    TO_GRID: 'navigateToGrid',
    TO_HOME: 'navigateToHomeGrid',
    TO_LAST: 'navigateToLastOpenedGrid',
    OPEN_SEARCH: 'navigateToSearch'
}

export { GridActionNavigate };