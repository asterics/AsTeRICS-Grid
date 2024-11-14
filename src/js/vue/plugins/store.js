import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        gridData: null,
        editElementId: null
    },
    mutations: {
        setGridData(state, payload) {
            state.gridData = payload;
        },
        setEditElementId(state, payload) {
            state.editElementId = payload;
        }
    }
});

export default store;
