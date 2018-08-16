import {dataService} from "../service/dataService";
import Vue from 'vue'

var AllGridsView = {};

AllGridsView.init = function() {
    dataService.getGrids().then(grids => {
        console.log(grids);
        var app = new Vue({
            el: '#app',
            data: {
                grids: grids,
                searchText: ''
            },
            computed: {
                filteredGrids() {
                    return this.grids.filter(grid => {
                        return grid.label.toLowerCase().includes(this.searchText.toLowerCase())
                    })
                }
            }
        })
    });
};

export {AllGridsView};