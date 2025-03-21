<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')">
                    <div class="modal-header">
                        <div class="row">
                            <h1>Matrix messenger</h1>
                        </div>
                    </div>

                    <nav-tabs class="mb-5" :tab-labels="Object.keys(TABS)" v-model="currentTab"></nav-tabs>

                    <div class="modal-body mt-2">
                        <div v-if="initialLoading">Loading ... <i class="fas fa-spinner fa-spin"></i></div>
                        <div v-if="!initialLoading">
                            <configure-matrix-general :logged-in-user="loggedInUser" @user="loggedInUserChanged" v-if="currentTab === TABS.TAB_GENERAL"></configure-matrix-general>
                            <configure-matrix-messages :logged-in-user="loggedInUser" v-if="currentTab === TABS.TAB_MESSAGES"></configure-matrix-messages>
                        </div>
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container">
                            <div class="srow">
                                <button @click="close()" class="four columns offset-by-four">
                                    <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                                </button>
                                <button @click="save()" class="four columns">
                                    <i class="fas fa-check"/> <span>{{ $t('ok') }}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../../css/modal.css';
    import NavTabs from "../../components/nav-tabs.vue";
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import ConfigureMatrixGeneral from './configure-matrix-general.vue';
    import ConfigureMatrixMessages from './configure-matrix-messages.vue';

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_ROOMS = 'TAB_ROOMS';
    const TAB_MESSAGES = 'TAB_MESSAGES';
    const TABS = {TAB_GENERAL, TAB_ROOMS, TAB_MESSAGES};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'undoService', 'newPosition'],
        components: {
            ConfigureMatrixMessages,
            ConfigureMatrixGeneral,
            NavTabs
        },
        data: function () {
            return {
                TABS: TABS,
                currentTab: TAB_GENERAL,
                loggedInUser: undefined
            }
        },
        computed: {
            initialLoading() {
                return this.loggedInUser === undefined;
            }
        },
        methods: {
            save() {

                this.close();
            },
            close() {
                this.$emit('close');
            },
            loggedInUserChanged(user) {
                this.loggedInUser = user;
            }
        },
        async mounted() {
            this.loggedInUser = await matrixService.getLoggedInUsername();
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.modal-container {
    min-height: 50vh;
}

.row {
    margin-bottom: 1em;
}
</style>