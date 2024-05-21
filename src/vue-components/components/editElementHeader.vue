<template>
    <div class="container-fluid px-0 mb-5">
        <div class="row">
            <div class="col-8 col-sm-10 col-md-5 order-md-1">
                <h1 name="header" class="inline">
                    {{ header }}
                </h1>
            </div>
            <a v-if="openHelpFn" class="col-2 col-sm-1 col-md black order-md-3" href="javascript:;" @click="openHelpFn" :title="helpTooltip"><i class="fas fa-question-circle"></i></a>
            <a v-if="closeFn" id="closeLink" :title="closeTooltip" class="col-2 col-sm-1 col-md black order-md-4" href="javascript:;" @click="closeFn"><i class="fas fa-times"/></a>
            <div class="col-12 col-md-5 d-flex align-items-center order-md-2 mt-2 mt-md-0" v-if="gridElement">
                <div :class="editingClass">
                    <img class="me-1" v-if="gridElement.image && (gridElement.image.data || gridElement.image.url)" height="30" :src="gridElement.image.data || gridElement.image.url"/>
                    <span>{{ gridElement.label | extractTranslation }}</span>
                </div>
                <div v-if="gridElement.type !== GridElement.ELEMENT_TYPE_NORMAL">
                    <span class="mx-2">{{ gridElement.type | translate }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { GridElement } from "../../js/model/GridElement.js";

    export default {
        props: ["header", "gridElement", "openHelpFn", "closeFn"],
        data() {
            return {
                GridElement: GridElement,
                isEditing: false // Assuming there's a way to determine the editing mode
            }
        },
        computed: {
            editingClass() {
                return this.isEditing ? 'editing-on editing-on-cursor' : 'editing-off';
            },
            helpTooltip() {
                return this.isEditing ? 'Click to get help in editing mode' : 'Click to get help in view mode';
            },
            closeTooltip() {
                return this.isEditing ? 'Click to exit editing mode' : 'Click to close';
            }
        }
    }
</script>


