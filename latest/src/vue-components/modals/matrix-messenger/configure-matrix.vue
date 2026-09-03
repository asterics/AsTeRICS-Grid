<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container modal-container-flex" @keydown.esc="$emit('close')">
                    <div class="modal-header">
                        <div class="row">
                            <h1 class="col">Matrix messenger</h1>
                            <div class="col-auto d-flex">
                                <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                            </div>
                        </div>
                    </div>

                    <nav-tabs class="mb-5" :tab-labels="Object.keys(TABS)" v-model="currentTab"></nav-tabs>

                    <div class="modal-body mt-2">
                        <div v-if="initialLoading">{{ $t("loading") }} ... <i class="fas fa-spinner fa-spin"></i></div>
                        <div v-if="!initialLoading && !loggedInUser && currentTab !== TABS.TAB_GENERAL">
                            <i18n path="pleaseLoginInTab" tag="span">
                                <template v-slot:tab><a href="javascript:;" @click="currentTab = TABS.TAB_GENERAL">{{ $t('TAB_GENERAL') }}</a></template>
                            </i18n>
                        </div>
                        <configure-matrix-general v-if="!initialLoading && currentTab === TABS.TAB_GENERAL" :logged-in-user="loggedInUser" @user="loggedInUserChanged"></configure-matrix-general>
                        <div v-if="!initialLoading && loggedInUser">
                            <configure-matrix-messages v-if="currentTab === TABS.TAB_MESSAGES"></configure-matrix-messages>
                            <configure-matrix-rooms v-if="currentTab === TABS.TAB_ROOMS"></configure-matrix-rooms>
                        </div>
                    </div>

                    <div class="modal-footer modal-footer-flex">
                        <div class="button-container">
                            <div class="srow">
                                <button @click="save()" class="six columns offset-by-six">
                                    <i class="fas fa-check"/> <span>{{ $t('closeModal') }}</span>
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
    import ConfigureMatrixRooms from './configure-matrix-rooms.vue';

    const TAB_GENERAL = 'TAB_GENERAL';
    const TAB_ROOMS = 'TAB_ROOMS';
    const TAB_MESSAGES = 'TAB_MESSAGES';
    const TABS = {TAB_GENERAL, TAB_ROOMS, TAB_MESSAGES};

    export default {
        props: ['editElementIdParam', 'gridDataId', 'undoService', 'newPosition'],
        components: {
            ConfigureMatrixRooms,
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
            let result = await matrixService.login();
            switch (result) {
                case matrixService.LOGIN_RESULTS.SUCCESS:
                    this.loggedInUser = await matrixService.getUsername();
                    break;
                case matrixService.LOGIN_RESULTS.MISSING_DATA:
                    this.loggedInUser = null;
                    break;
                default:
                    log.warn("matrix: unknown error at login");
            }
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