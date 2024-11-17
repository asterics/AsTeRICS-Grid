import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        // NOTE: gridData, metadata, gridInstance are objects, thus properties itself are not reactive.
        //       Always replace the object with a new one to trigger reactivity.
        gridData: null,
        metadata: null,
        gridInstance: null,
        editElementId: null
    },
    mutations: {
        setGridData(state, payload) {
            state.gridData = payload;
        },
        setMetadata(state, payload) {
            state.metadata = payload;
        },
        setGridInstance(state, payload) {
            state.gridInstance = payload;
        },
        setEditElementId(state, payload) {
            state.editElementId = payload;
        }
    }
});

export default store;
