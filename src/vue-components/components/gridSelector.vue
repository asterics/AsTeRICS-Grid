<template>
    <div class="container-fluid px-0">
        <div class="row">
            <div class="col-12 col-md-5">
                <div class="row">
                    <label for="moveGrid">{{ selectLabel }}</label>
                </div>
                <div class="row">
                    <div class="col-12">
                        <select class="col-12" id="moveGrid" v-model="selectedGrid" @change="selectGrid(selectedGrid)" style="margin-bottom: 1em">
                            <option v-if="additionalSelectOptions" v-for="option in additionalSelectOptions" :value="option">{{ option | translate}}</option>
                            <option v-for="grid in grids" :value="grid">{{grid.label | extractTranslation}}</option>
                        </select>
                    </div>
                </div>
                <div class="row" v-if="selectedGrid && selectedGrid.id">
                    <div class="col-12">
                        <img :src="selectedGrid.thumbnail ? selectedGrid.thumbnail.data : imageUtil.getEmptyImage()" style="max-width: 100%; border: 1px solid lightgray"/>
                    </div>
                </div>
                <div class="row" v-if="selectedGrid && selectedGrid.id">
                    <div class="col-12">
                        <button @click="prev" style="width: 49%"><i class="fas fa-arrow-left"></i> <span>{{ $t('back') }}</span></button>
                        <button @click="next" style="width: 49%"><span>{{ $t('next') }}</span> <i class="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {imageUtil} from "../../js/util/imageUtil.js";

    export default {
        props: ["excludeId", "value", "selectLabel", "additionalSelectOptions"],
        data() {
            return {
                currentValue: this.value,
                grids: [],
                selectedGrid: {},
                imageUtil: imageUtil,
                i18nService: i18nService,
            }
        },
        watch: {
            value: function (newVal, oldVal) {
                this.selectedGrid = newVal;
            }
        },
        methods: {
            selectGrid(grid) {
                this.selectedGrid = grid;
                this.$emit('input', grid)
            },
            prev() {
                let currentIndex = this.grids.indexOf(this.selectedGrid);
                let newIndex = (currentIndex - 1) < 0 ? this.grids.length - 1 : currentIndex - 1;
                this.selectGrid(this.grids[newIndex]);
            },
            next() {
                let currentIndex = this.grids.indexOf(this.selectedGrid);
                let newIndex = (currentIndex + 1) < this.grids.length ? currentIndex + 1 : 0;
                this.selectGrid(this.grids[newIndex]);
            },
        },
        mounted() {
            let additionalOpts = this.additionalSelectOptions || [];
            dataService.getGrids(false, true).then(grids => {
                this.grids = JSON.parse(JSON.stringify(grids)).filter(grid => !this.excludeId || grid.id !== this.excludeId);
                this.grids.sort((a, b) => {
                    return i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label));
                })
                this.selectGrid(additionalOpts[0] || this.grids[0]);
            })
        },
    }
</script>

<style scoped>
</style>