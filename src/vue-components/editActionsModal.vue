<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" v-if="gridElement">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            <span data-i18n>Edit actions // Aktionen bearbeiten</span> <span>("{{gridElement.label}}")</span>
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label class="three columns" data-i18n="">New Action // Neue Aktion</label>
                            <div class="nine columns">
                                <select v-model="selectedNewAction">
                                    <option v-for="type in actionTypes" :value="type.getModelName()">{{type.getModelName() | translate}}</option>
                                </select>
                                <button @click="addAction()" class="spaced"><i class="fas fa-plus"/> <span class="hide-mobile" data-i18n="">Add action // Aktion hinzufügen</span></button>
                            </div>
                        </div>
                        <div class="row">
                            <label for="actionList" class="twelve columns" data-i18n="" style="margin-top: 1em; font-size: 1.2em">Current actions // Aktuelle Aktionen</label>
                        </div>
                        <ul id="actionList">
                            <span v-show="gridElement.actions.length == 0" class="row" data-i18n="">
                                <span>No actions defined, click on '<i class="fas fa-plus"/> <span class="hide-mobile">Add action</span>' to add one.</span>
                                <span>Keine Aktionen definiert, klicken Sie auf "<i class="fas fa-plus"/> <span class="hide-mobile">Aktion hinzufügen</span>" um eine Aktion zu definieren.</span>
                            </span>
                            <li v-for="action in gridElement.actions" class="row">
                                <div v-show="editActionId != action.id">
                                    <div class="four columns">
                                        {{action.modelName | translate}}
                                    </div>
                                    <div class="eight columns">
                                        <button @click="editAction(action)"><i class="far fa-edit"/> <span class="hide-mobile" data-i18n="">Edit // Bearbeiten</span></button>
                                        <button @click="deleteAction(action)"><i class="far fa-trash-alt"/> <span class="hide-mobile" data-i18n="">Delete // Löschen</span></button>
                                    </div>
                                </div>
                                <div v-show="editActionId == action.id">
                                    <div class>
                                        <b>{{action.modelName | translate}}</b>
                                    </div>
                                    <div>
                                        <div v-show="action.modelName == 'GridActionSpeak'">
                                            <div class="row">
                                                <div class="twelve columns">
                                                    <label for="selectLang" class="normal-text" data-i18n>Language // Sprache</label>
                                                    <select id="selectLang" type="text" v-model="action.speakLanguage">
                                                        <option v-for="lang in voiceLangs" :value="lang">
                                                            {{lang | translate}}
                                                        </option>
                                                    </select>
                                                    <button @click="testAction(action)" class="inline spaced"><i class="fas fa-bolt"/> <span class="hide-mobile" data-i18n="">Test // Testen</span></button>
                                                </div>
                                            </div>
                                            <div class="row right">
                                                <button @click="endEditAction()"><i class="fas fa-check"/> <span class="hide-mobile">OK</span></button>
                                            </div>
                                        </div>
                                        <div v-show="action.modelName == 'GridActionNavigate'">
                                            <div class="row">
                                                <div class="five columns">
                                                    <label for="selectGrid" class="normal-text" data-i18n>Grid to navigate // Navigieren zu Grid</label>
                                                    <select id="selectGrid" type="text" v-model="action.toGridId">
                                                        <option v-for="(label, id) in gridLabels" :value="id" v-bind:selected="index === 0">
                                                            {{label}}
                                                        </option>
                                                    </select>
                                                </div>
                                                <div class="five columns">
                                                    <button @click="endEditAction()"><i class="fas fa-check"/> <span class="hide-mobile">OK</span></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div class="modal-footer">
                        <button class="u-pull-right" @click="save()">
                            OK
                        </button>
                        <button class="u-pull-right spaced" @click="$emit('close')" data-i18n>
                            Cancel // Abbrechen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {dataService} from './../js/service/dataService'
    import {actionService} from './../js/service/actionService'
    import {I18nModule} from './../js/i18nModule.js';
    import {imageUtil} from './../js/util/imageUtil';
    import {GridActionNavigate} from "../js/model/GridActionNavigate";
    import './../css/modal.css';
    import {GridElement} from "../js/model/GridElement";
    import {GridData} from "../js/model/GridData";

    export default {
        props: ['editElementId', 'gridData'],
        data: function () {
            return {
                gridElement: null,
                editActionId: null,
                selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
                gridLabels: null,
                actionTypes: GridElement.getActionTypes(),
                voiceLangs: actionService.getVoicesLangs()
            }
        },
        methods: {
            deleteAction (action) {
                this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
            },
            editAction (action) {
                this.editActionId = action.id;
            },
            endEditAction () {
                this.editActionId = null;
            },
            testAction (action) {
                actionService.testAction(this.gridElement, action);
            },
            addAction () {
                var newAction = GridElement.getActionInstance(this.selectedNewAction);
                if(newAction instanceof GridActionNavigate) {
                    newAction.toGridId = Object.keys(this.gridLabels)[0];
                }
                this.gridElement.actions.push(newAction);
                this.editActionId = newAction.id;
            },
            save () {
                var thiz = this;
                dataService.updateOrAddGridElement(this.gridData.id, this.gridElement).then(() => {
                    this.$emit('close');
                });
            },
        },
        mounted () {
            var thiz = this;
            dataService.getGridElement(thiz.gridData.id, this.editElementId).then(gridElem => {
                log.debug('editing actions for element: ' + gridElem.label);
                thiz.gridElement = JSON.parse(JSON.stringify(gridElem));
            });
            dataService.getGridsAttribute('label').then(map => {
                thiz.gridLabels = map;
            })
        },
        updated() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }

    ul li {
        list-style: none;
        outline: 1px solid lightgray;
        padding: 0.5em;
    }

    [v-cloak] {
        display: none !important;
    }

    .normal-text {
        font-weight: normal;
    }
</style>