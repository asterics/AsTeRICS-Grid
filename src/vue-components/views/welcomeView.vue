<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="container ms-0">
            <div class="row ps-2 ps-sm-3 ps-md-4 col-12 col-md-10 col-xl-8">
                <h2><span class="show-mobile">AsTeRICS Grid - </span><span>{{ $t('welcome') }}</span></h2>
                <div>
                    <h3>
                        <i18n path="useAstericsGridWithoutRegistrationBold" tag="span">
                            <template v-slot:withoutReg>
                                <strong>{{ $t('withoutRegistration') }}</strong>
                            </template>
                        </i18n>
                    </h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allGridsAreSavedOffline') }}</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allFunctionsAvailable') }}</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('idealForUsingOnASingleDevice') }}</span></li>
                    </ul>
                    <div class="row">
                        <div class="col-12">
                            <button class="big-button col-12" @click="useDefaultUser()">
                                <i class="fas fa-user-secret me-2"></i>
                                <span>{{ $t('useAstericsGridWithoutRegistration') }}</span>&nbsp;&nbsp;<i v-if="loading" class="fas fa-spinner fa-spin"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <span class="fa fa-info-circle"></span><span class="break-word">{{ $t('itsAlwaysPossibleToRegisterLater') }}</span>
                    </div>
                </div>
                <div class="mt-4">
                    <h3>
                        <i18n path="useAstericsGridWithRegistration" tag="span">
                            <template v-slot:withReg>
                                <strong>{{ $t('withRegistration') }}</strong>
                            </template>
                        </i18n>
                    </h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allGridsAreSavedOfflineAndOnline') }}</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('automaticSynchronizationAcrossMultipleDevices') }}</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allDataIsEndtoendEncryptedAndOnlyYouAreAble') }}</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('forRegistrationOnlyAUsernameAndAPasswordIsNeeded') }}</span></li>
                    </ul>
                    <div class="row">
                        <div class="col-12">
                            <button class="big-button col-12" @click="toRegister()"><i class="fas fa-user-plus me-2"></i> {{ $t('registerNow') }}</button>
                        </div>
                    </div>

                </div>
                <div class="my-5">
                    <span>{{ $t('alreadyHaveAnAccount') }}</span>
                    <a href="javascript:;" @click="Router.to('#login')">{{ $t('toLogin') }}</a>
                </div>
                <div>
                    <b>{{ $t('hint') }}</b>
                    <i18n path="ifYouNeedHelpWithinAstericsGrid" tag="span">
                        <template v-slot:openHelpIcon>
                            <a href="javascript:;" @click="openHelp"><i class="fas fa-question-circle"></i></a>
                        </template>
                    </i18n>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {helpService} from "../../js/service/helpService";
    import {loginService} from "../../js/service/loginService";

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                loading: false,
                Router: Router
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            toRegister() {
                Router.toRegister();
            },
            useDefaultUser() {
                this.loading = true;
                loginService.registerOffline(constants.LOCAL_NOLOGIN_USERNAME, constants.LOCAL_NOLOGIN_USERNAME).then(() => {
                    Router.toManageGrids();
                });
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    li {
        margin-bottom: 0;
        list-style-type: none;
        margin-left: 0.5em;
    }
    ul {
        margin-bottom: 0.5em;
    }
    .fa-check {
        color: green;
        margin-right: 1em;
    }
    .fa-info-circle {
        color: #266697;
        margin-right: 0.5em;
    }
</style>