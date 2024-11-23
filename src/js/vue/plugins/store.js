import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        // NOTE: Properties of object itself are not reactive.
        //       Always replace the object with a new one to trigger reactivity.
        dict: null,
        dicts: null,
        gridData: null,
        grids: null,
        metadata: null,
        gridInstance: null,
        gridFrom: null,
        gridTo: null,
        exportOptions: null,
        searchModalOptions: null,
        routeToEdit: null,
        editElementId: null,
        printGridId: null,
    },
    mutations: {
        setDict(state, payload) {
            state.dict = payload;
        },
        setDicts(state, payload) {
            state.dicts = payload;
        },
        setGridData(state, payload) {
            state.gridData = payload;
        },
        setGrids(state, payload) {
            state.grids = payload;
        },
        setMetadata(state, payload) {
            state.metadata = payload;
        },
        setGridInstance(state, payload) {
            state.gridInstance = payload;
        },
        setGridFrom(state, payload) {
            state.gridFrom = payload;
        },
        setGridTo(state, payload) {
            state.gridTo = payload;
        },
        setExportOptions(state, payload) {
            state.exportOptions = payload;
        },
        setSearchModalOptions(state, payload) {
            state.searchModalOptions = payload;
        },
        setRouteToEdit(state, payload) {
            state.routeToEdit = payload;
        },
        setEditElementId(state, payload) {
            state.editElementId = payload;
        },
        setPrintGridId(state, payload) {
            state.printGridId = payload;
        }
    }
});

export default store;
