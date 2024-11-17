<template>
    <modal :title="$t('setGridSize')" @ok="save">
        <template #default>
            <div class="srow">
                <label for="gridRows" class="seven columns">{{ $t('numberOfRows') }}</label>
                <input id="gridRows" type="number" class="three columns" v-model.number="gridData.rowCount" min="1" max="100"/>
            </div>
            <div class="srow">
                <label for="gridCols" class="seven columns">{{ $t('minimumNumberOfColumns') }}</label>
                <input id="gridCols" type="number" class="three columns" v-model.number="gridData.minColumnCount" min="1" max="100"/>
            </div>
            <div class="srow" v-if="isGlobalGrid && metadata && gridHeight === 1">
                <label for="metadataHeight" class="seven columns">{{ $t('heightOfFirstGlobalGridRow') }}</label>
                <input id="metadataHeight" type="number" class="three columns" v-model.number="metadata.globalGridHeightPercentage" min="5" max="50"/>
            </div>
        </template>
    </modal>
</template>

<script>
import { i18nService } from '../../js/service/i18nService';
import Modal from './modal.vue';
import { modalMixin } from '../mixins/modalMixin.js';
import { localStorageService } from '../../js/service/data/localStorageService';
import { dataService } from '../../js/service/data/dataService';
import { GridData } from '../../js/model/GridData';

export default {
    components: { Modal },
    mixins: [modalMixin],
    computed: {
        gridData() {
            return this.$store.state.gridData;
        },
        metadata() {
            return this.$store.state.metadata;
        },
        gridHeight() {
            return new GridData(this.gridData).getHeight();
        },
        isGlobalGrid() {
            return this.metadata.globalGridId === this.gridData.id;
        }
    },
    methods: {
        save() {
            this.gridData.rowCount = Math.min(this.gridData.rowCount, 100);
            this.gridData.minColumnCount = Math.min(this.gridData.minColumnCount, 100);
            localStorageService.saveLastGridDimensions({
                rowCount: this.gridData.rowCount,
                minColumnCount: this.gridData.minColumnCount
            });
            let promises = [];
            if (this.metadata) {
                promises.push(dataService.saveMetadata(this.metadata));
            }
            Promise.all(promises).then(() => {
                this.$emit('save', this.gridData.rowCount, this.gridData.minColumnCount);
                this.$emit('close');
            });
        }
    },
    mounted() {
        if (this.isGlobalGrid) {
            dataService.getMetadata().then((metadata) => {
                this.metadata = JSON.parse(JSON.stringify(metadata));
            });
        }
    }
};
</script>

<style scoped>
.srow {
    margin-top: 1em;
}
</style>
