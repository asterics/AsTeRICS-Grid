<template>
    <div v-if="gridElement">
        <div class="srow">
            <label class="three columns">{{ $t('newAction') }}</label>
            <select id="selectActionType" v-focus="" class="four columns" v-model="selectedNewAction" style="margin-bottom: 0.5em">
                <option v-for="type in actionTypes" :value="type.getModelName()">{{type.getModelName() | translate}}</option>
            </select>
            <button class="four columns" @click="addAction()"><i class="fas fa-plus"/> <span>{{ $t('addAction') }}</span></button>
        </div>
        <div class="srow">
            <h2 for="actionList" class="twelve columns" style="margin-top: 1em; font-size: 1.2em">{{ $t('currentActions') }}</h2>
        </div>
        <ul id="actionList">
                            <span v-show="gridElement.actions.length == 0" class="srow">
                                <i18n path="noActionsDefinedClickOnAdd" tag="span">
                                    <template v-slot:addAction>
                                        <i class="fas fa-plus"/> <span class="hide-mobile">{{ $t('addAction') }}</span>
                                    </template>
                                </i18n>
                            </span>
            <li v-for="action in gridElement.actions" class="srow">
                <div class="row mt-0">
                    <div class="col-12 col-md-4 mb-3">
                        <span v-show="editActionId !== action.id">{{action.modelName | translate}}</span>
                        <span v-show="editActionId === action.id">
                            <b>{{action.modelName | translate}}</b>
                            <a class="black" href="javascript:;" @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                        </span>
                    </div>
                    <div class="col-12 col-md-8 actionbtns">
                        <button @click="editAction(action)"><i class="far fa-edit"/>
                            <span class="hide-mobile" v-show="editActionId !== action.id">{{ $t('edit') }}</span>
                            <span class="hide-mobile" v-show="editActionId === action.id">{{ $t('endEdit') }}</span>
                        </button>
                        <button @click="deleteAction(action)"><i class="far fa-trash-alt"/> <span class="hide-mobile">{{ $t('delete') }}</span></button>
                        <button v-if="GridElement.canActionClassBeTested(action.modelName)" @click="testAction(action)"><i class="fas fa-bolt"/> <span class="hide-mobile">{{ $t('test') }}</span></button>
                    </div>
                </div>
                <div v-if="editActionId === action.id" style="margin-top: 1.5em; margin-bottom: 1em">
                    <edit-action :action="action" :grids="grids" :grid-data="gridData" :grid-element="gridElement"/>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
    import {dataService} from '../../js/service/data/dataService'
    import {actionService} from './../../js/service/actionService'
    import {i18nService} from "../../js/service/i18nService";
    import {GridActionNavigate} from "../../js/model/GridActionNavigate";
    import './../../css/modal.css';
    import {GridElement} from "../../js/model/GridElement";
    import {GridData} from "../../js/model/GridData";
    import EditAreAction from "./editActionsSub/editAREAction.vue";
    import EditOpenHabAction from "./editActionsSub/editOpenHABAction.vue";
    import {helpService} from "../../js/service/helpService";
    import Accordion from "../components/accordion.vue";
    import RadioListSelector from "../components/radioListSelector.vue";
    import EditAudioAction from "./editActionsSub/editAudioAction.vue";
    import EditWordFormAction from "./editActionsSub/editWordFormAction.vue";
    import EditHttpAction from "./editActionsSub/editHttpAction.vue";
    import EditPredefinedAction from './editActionsSub/editPredefinedAction.vue';
    import EditAction from './editAction.vue';

    export default {
        props: ['gridElement', 'gridData'],
        data: function () {
            return {
                grids: null,
                editActionId: null,
                selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
                actionTypes: GridElement.getActionTypes(),
                GridElement: GridElement
            }
        },
        components: {
            EditAction,
            EditPredefinedAction,
            EditWordFormAction,
            EditAudioAction,
            RadioListSelector,
            Accordion,
            EditAreAction,
            EditOpenHabAction,
            EditHttpAction
        },
        methods: {
            deleteAction (action) {
                this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
            },
            editAction (action) {
                if (this.editActionId !== action.id) {
                    this.editActionId = action.id;
                } else {
                    this.editActionId = null;
                }
            },
            testAction (action) {
                actionService.testAction(this.gridElement, action, new GridData(this.gridData));
            },
            addAction () {
                let thiz = this;
                let newAction = JSON.parse(JSON.stringify(GridElement.getActionInstance(this.selectedNewAction)));
                if (newAction.modelName === GridActionNavigate.getModelName()) {
                    newAction.toGridId = this.grids[0].id;
                }
                thiz.gridElement.actions.push(newAction);
                thiz.editActionId = newAction.id;
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted () {
            let thiz = this;
            dataService.getGrids(false, true).then(grids => {
                thiz.grids = grids;
                thiz.grids = thiz.grids.sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
            });
            helpService.setHelpLocation('05_actions', '#edit-actions-modal');
        },
        beforeDestroy() {
            helpService.setHelpLocation('02_navigation', '#edit-view');
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    ul li {
        list-style: none;
        outline: 1px solid lightgray;
        padding: 0.5em;
    }

    .actionbtns button {
        width: 32%;
        padding: 0;
    }
</style>