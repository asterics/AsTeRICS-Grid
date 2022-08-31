<template>
    <div class="container ms-2">
        <h1>{{ $t('importConfiguration') }}</h1>
        <div>{{ $t('currentlyNoGridsAreSetUpChooseAConfiguration') }}</div>

        <config-import-selector></config-import-selector>
        <div>
            <span>{{ $t('alternativelyYouCan') }}</span>:
            <ul class="mt-3">
                <li><a href="javascript:;" @click="addEmptyGrid()">{{ $t('addAnEmptyGridAndStartFromScratch') }}</a></li>
                <li><a href="javascript:;" @click="restoreBackupHandler()">{{ $t('restoreBackupFromFile') }}</a></li>
                <li><a href="javascript:;" @click="importCustomHandler()">{{ $t('importCustomDataFromFile') }}</a></li>
            </ul>
        </div>
    </div>
</template>

<script>
    import ConfigImportSelector from "./configImportSelector.vue";
    import {dataService} from "../../js/service/data/dataService.js";
    import {GridData} from "../../js/model/GridData.js";
    import {Router} from "../../js/router.js";
    import {i18nService} from "../../js/service/i18nService.js";

    export default {
        components: {ConfigImportSelector},
        props: ["restoreBackupHandler", "importCustomHandler"],
        data() {
            return {
            }
        },
        methods: {
            addEmptyGrid() {
                let label = {};
                label[i18nService.getContentLang()] = "New grid";
                let gridData = new GridData({
                    label: label,
                    gridElements: [],
                    rowCount: 3,
                    minColumnCount: 4
                });
                dataService.saveGrid(gridData).then(() => {
                    Router.toEditGrid(gridData.id);
                });
            }
        },
        mounted() {
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
</style>