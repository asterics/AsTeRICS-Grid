import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        // NOTE: gridData and metadata are objects, thus properties itself are not reactive.
        //       Always replace the object with a new one to trigger reactivity.
        gridData: null,
        metadata: null,
        editElementId: null
    },
    mutations: {
        setGridData(state, payload) {
            state.gridData = payload;
        },
        setEditElementId(state, payload) {
            state.editElementId = payload;
        },
        setMetadata(state, payload) {
            state.metadata = payload;
        }
    }
});

export default store;
