<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span>{{ $t('welcome') }}</span></h2>
            <div class="eight columns offset-by-one">
                <div class="srow">
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
                    <button @click="useDefaultUser()">
                        <span>{{ $t('useAstericsGridWithoutRegistration') }}</span>&nbsp;&nbsp;<i v-if="loading" class="fas fa-spinner fa-spin"></i>
                    </button>
                    <div>
                        <span class="fa fa-info-circle"></span><span class="break-word">{{ $t('itsAlwaysPossibleToRegisterLater') }}</span>
                    </div>
                </div>
                <div class="srow">
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
                    <button @click="toRegister()">{{ $t('registerNow') }}</button>
                </div>
                <div class="srow">
                    <span>{{ $t('alreadyHaveAnAccount') }}</span>
                    <a href="#login">{{ $t('toLogin') }}</a>
                </div>
                <div class="srow">
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
    import {i18nService} from "../../js/service/i18nService";
    import {databaseService} from "../../js/service/data/databaseService";
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {helpService} from "../../js/service/helpService";
    import {loginService} from "../../js/service/loginService";

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                loading: false
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
                    Router.toMain();
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
    .srow {
        margin-bottom: 1.5em;
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
    button {
        background-color: lightblue;
        padding: 0.7em;
        border-radius: 10px;
        font-size: 1.3em;
    }
    @media (max-width: 850px) {
        button {
            width: 100%;
        }
    }
    @media (min-width: 850px) {
        button {
            width: 30em;
        }
    }
</style>