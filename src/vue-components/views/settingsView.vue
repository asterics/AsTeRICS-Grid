<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <nav-tabs v-model="currentTab" @input="saveState = SAVE_STATES.STATE_INITIAL" :tab-labels="Object.keys(TABS)"/>
        <div style="position: relative">
            <span style="position: absolute; right: 1em; top: 1em">
                <span v-if="saveState === SAVE_STATES.STATE_SAVING" class="fas fa-spin fa-spinner"/>
                <span v-if="saveState === SAVE_STATES.STATE_SAVED" class="fas fa-check"/>
            </span>
        </div>
        <div class="srow content spaced mt-4" v-if="metadata">
            <settings-general v-if="currentTab === TABS.TAB_GENERAL" :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings" @changing="onChanging" @changed="onChanged"/>
            <settings-language v-if="currentTab === TABS.TAB_LANGUAGE" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-appearance v-if="currentTab === TABS.TAB_APPEARANCE" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-input-methods v-if="currentTab === TABS.TAB_INPUTMETHODS" :metadata="metadata" :user-settings-local="userSettingsLocal" @changing="onChanging" @changed="onChanged"/>
            <settings-integrations v-if="currentTab === TABS.TAB_INTEGRATIONS" :metadata="metadata" :user-settings-local="userSettingsLocal" :app-settings="appSettings" @changing="onChanging" @changed="onChanged"/>
        </div>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {dataService} from "../../js/service/data/dataService";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import NavTabs from '../components/nav-tabs.vue';
    import SettingsGeneral from './settings/settingsGeneral.vue';
    import SettingsLanguage from './settings/settingsLanguage.vue';
    import SettingsIntegrations from './settings/settingsIntegrations.vue';
    import SettingsAppearance from './settings/settingsAppearance.vue';
    import SettingsInputMethods from './settings/settingsInputMethods.vue';

    const TABS = {
        TAB_GENERAL: 'TAB_GENERAL',
        TAB_LANGUAGE: 'TAB_LANGUAGE',
        TAB_APPEARANCE: 'TAB_APPEARANCE',
        TAB_INPUTMETHODS: 'TAB_INPUTMETHODS',
        TAB_INTEGRATIONS: 'TAB_INTEGRATIONS'
    };

    const SAVE_STATES = {
        STATE_INITIAL: 'STATE_INITIAL',
        STATE_SAVING: 'STATE_SAVING',
        STATE_SAVED: 'STATE_SAVED'
    };

    export default {
        components: { SettingsInputMethods, SettingsAppearance, SettingsIntegrations, SettingsLanguage, SettingsGeneral, NavTabs, HeaderIcon},
        props: [],
        data() {
            return {
                metadata: null,
                appSettings: localStorageService.getAppSettings(),
                userSettingsLocal: localStorageService.getUserSettings(),
                TABS: TABS,
                currentTab: TABS.TAB_GENERAL,
                SAVE_STATES: SAVE_STATES,
                saveState: SAVE_STATES.STATE_INITIAL
            }
        },
        methods: {
            onChanging() {
                this.saveState = SAVE_STATES.STATE_SAVING;
            },
            onChanged() {
                this.saveState = SAVE_STATES.STATE_SAVED;
            }
        },
        async mounted() {
            let metadata = await dataService.getMetadata();
            this.metadata = JSON.parse(JSON.stringify(metadata));
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
</style>