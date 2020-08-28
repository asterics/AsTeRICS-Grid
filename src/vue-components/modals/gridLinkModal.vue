<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Link grids // Grids verknüpfen
                        </h1>
                    </div>

                    <div class="modal-body" v-if="gridFrom">
                        <div class="row">
                            <div class="four columns">
                                <div>
                                    <div>{{gridFrom.label | extractTranslation}}</div>
                                    <img :src="gridFrom.thumbnail ? gridFrom.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; border: 1px solid lightgray"/>
                                </div>
                            </div>
                            <i class="fas fa-2x fa-arrow-right hide-mobile two columns" style="margin-top: 2em"/>
                            <i class="fas fa-2x fa-arrow-down show-mobile two columns" style="margin: 0.5em 20%"/>
                            <div class="four columns">
                                <div>{{gridTo.label | extractTranslation}}</div>
                                <img :src="gridTo.thumbnail ? gridTo.thumbnail.data : imageUtil.getEmptyImage()" style="height: 150px; border: 1px solid lightgray"/>
                            </div>
                        </div>
                        <div class="row">
                            <label class="three columns" for="elementName" data-i18n="">Connect with element // Verknüpfung über Element</label>
                            <select id="elementName" class="four columns" v-model="selectedElement">
                                <option :value="null" data-i18n="">create new Element // neues Element erstellen</option>
                                <option v-for="elem in gridFrom.gridElements" :value="elem">{{i18nService.getTranslation(elem.label) || i18nService.translate('(empty element) // (leeres Element)')}}</option>
                            </select>
                        </div>
                        <div class="row" v-show="!selectedElement || !i18nService.getTranslation(selectedElement.label)">
                            <label class="three columns" for="elementLabel" data-i18n="">Label of new element // Label des neuen Elements</label>
                            <input type="text" id="elementLabel" class="four columns" v-model="newElementLabel[i18nService.getBrowserLang()]" maxlength="35"/>
                        </div>
                        <div class="row" v-show="selectedElement && selectedElement.actions.filter(e => e.modelName === GridActionNavigate.getModelName()).length > 0">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span data-i18n="">
                                <span><b>Hint: </b> This element already navigates to another grid. This navigation will be overwritten.</span>
                                <span><b>Hinweis: </b> Dieses Element navigiert bereits zu einem anderen Grid. Diese Navigation wird überschrieben.</span>
                            </span>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container row">
                            <button class="six columns" @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button class="six columns" @click="save()" title="Keyboard: [Ctrl + Enter]">
                                <i class="fas fa-check"/> <span>OK</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {imageUtil} from "../../js/util/imageUtil";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import {dataService} from "../../js/service/data/dataService";

    export default {
        props: ['gridFromProp', 'gridToProp'],
        data: function () {
            return {
                gridFrom: null,
                gridTo: JSON.parse(JSON.stringify(this.gridToProp)),
                inputText: "",
                selectedElement: null,
                newElementLabel: null,
                GridActionNavigate: GridActionNavigate,
                imageUtil: imageUtil,
                i18nService: i18nService
            }
        },
        methods: {
            save() {
                this.saveInternal().then(() => {
                    this.$emit('reload');
                    this.$emit('close');
                });
            },
            saveInternal() {
                let element = this.selectedElement;
                if (!element) {
                    let newPos = new GridData(this.gridFrom).getNewXYPos();
                    element = new GridElement({
                        label: this.newElementLabel,
                        x: newPos.x,
                        y: newPos.y
                    });
                    this.gridFrom.gridElements.push(element);
                }
                element.label = element.label || this.newElementLabel;
                element.actions = element.actions.filter(a => a.modelName !== GridActionNavigate.getModelName());
                element.actions.push(new GridActionNavigate({
                    toGridId: this.gridTo.id
                }));
                return dataService.saveGrid(this.gridFrom);
            }
        },
        mounted() {
            this.newElementLabel = JSON.parse(JSON.stringify(this.gridTo.label));
            dataService.getGrid(this.gridFromProp.id).then(gridFrom => {
                this.gridFrom = JSON.parse(JSON.stringify(gridFrom));
                i18nService.initDomI18n();
            });
        },
        updated() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>