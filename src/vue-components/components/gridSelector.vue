<template>
            <div class="selector">
                    <label for="moveGrid">{{ selectLabel }}</label>
                <div>
                        <select id="moveGrid" v-model="selectedGrid" @change="selectGrid(selectedGrid)" style="margin-bottom: 1em">
                            <option v-if="additionalSelectOptions" v-for="option in additionalSelectOptions" :value="option">{{ option | translate}}</option>
                            <option v-for="grid in grids" :value="grid">{{grid.label | extractTranslation}}</option>
                        </select>
                </div>
                <div v-if="selectedGrid && selectedGrid.thumbnail && selectedGrid.thumbnail.data">
                        <img :src="selectedGrid.thumbnail.data"/>
                </div>
                <div class="controls" v-if="selectedGrid && selectedGrid.id">
                        <button @click="prev" :aria-label="$t('back')"><i class="fas fa-arrow-left" aria-hidden="true"></i><span>{{ $t('back') }}</span></button>
                        <button @click="next" :aria-label="$t('next')"><span>{{ $t('next') }}</span><i class="fas fa-arrow-right" aria-hidden="true"></i></button>
                </div>
            </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService.js";
    import {i18nService} from "../../js/service/i18nService.js";
    import {imageUtil} from "../../js/util/imageUtil.js";

    export default {
        props: ["excludeId", "value", "selectLabel", "additionalSelectOptions", "includeGlobal"],
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
            dataService.getGrids(false, !this.includeGlobal).then(grids => {
                this.grids = JSON.parse(JSON.stringify(grids)).filter(grid => !this.excludeId || grid.id !== this.excludeId);
                this.grids.sort((a, b) => {
                    return i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label));
                })
                this.selectGrid(additionalOpts[0] || this.grids[0]);
            })
        },
    }
</script>

<style lang="scss" scoped>
.selector {
    display: flex;
    flex-flow: column nowrap;

    .controls {
        display: flex;
        flex-flow: row nowrap;
        justify-content: space-between;
        margin-top: 1rem;
    }

    label {
        font-weight: bold;
        margin-bottom: 0.5rem;
    }

    select {
        width: 100%;
    }

    button {
        width: 100%;
        margin-left: 1rem;

        &:first-child {
            margin-left: 0;
        }

        i + span,
        span + i {
            margin-left: 0.5rem;
        }
    }
}
</style>