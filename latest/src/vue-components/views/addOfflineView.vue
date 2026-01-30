<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span>{{ $t('addOfflineUser') }}</span></h2>
            <form autocomplete="off" onsubmit="event.preventDefault()">
                <div class="srow">
                    <label for="inputUser" class="two columns"><span class="desktop-right">{{ $t('username') }}</span></label>
                    <input type="text" name="username" autocapitalize="none" v-model="user" id="inputUser" class="six columns" @input="validationError = undefined" @change="validateUsername" v-debounce="300" v-focus=""/>
                    <div class="three columns" v-show="user != '' && validationError">
                        <i style="color: red;" class="fas fa-times"/> <span>{{validationError | translate}}</span>
                    </div>
                    <div class="three columns" v-show="user && validationError !== undefined && !validationError">
                        <i style="color: green;" class="fas fa-check"/> <span>{{ $t('validUsername') }}</span>
                    </div>
                </div>
            </form>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <i class="fas fa-2x fa-info-circle" style="color: blue"></i>
                    <span>
                        {{ $t('aLocalUserIsStoredOnlyOnThisDevice') }}
                    </span>
                </div>
            </div>
            <div class="srow">
                <button @click="addUser" :disabled="!user || validationError === undefined || validationError" class="six columns offset-by-two">
                    <span>{{ $t('addUser') }}</span>&nbsp;&nbsp;<i v-if="loading" class="fas fa-spinner fa-spin"></i>
                </button>
            </div>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <span>{{ $t('wantToRegisterAnOnlineUser') }}</span>
                    <a href="#register">{{ $t('toRegister') }}</a>
                </div>
            </div>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <span>{{ $t('alreadyHaveAnAccount') }}</span>
                    <a href="#login">{{ $t('toLogin') }}</a>
                </div>
            </div>
            <comparison-component></comparison-component>
        </div>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {databaseService} from "../../js/service/data/databaseService";
    import {loginService} from "../../js/service/loginService";
    import {i18nService} from "../../js/service/i18nService";
    import {constants} from "../../js/util/constants";
    import {Router} from "../../js/router";
    import ComparisonComponent from "./../components/comparisonComponent.vue";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'

    export default {
        components: {ComparisonComponent, HeaderIcon},
        props: [],
        data() {
            return {
                user: null,
                validationError: undefined,
                showInfo: false,
                savedUsers: localStorageService.getSavedUsers(),
                loading: false
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            addUser() {
                let thiz = this;
                thiz.loading = true;
                if (thiz.validationError != null) {
                    return;
                }
                loginService.registerOffline(thiz.user, thiz.user).then(() => {
                    Router.toManageGrids();
                });
            },
            validateUsername() {
                this.validationError = undefined;
                if (!constants.USERNAME_REGEX.test(this.user)) {
                    this.validationError = constants.VALIDATION_ERROR_REGEX;
                } else if (this.savedUsers.includes(this.user) || loginService.getLoggedInUsername() === this.user) {
                    this.validationError = constants.VALIDATION_ERROR_EXISTING;
                } else {
                    this.validationError = null;
                }
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }
    .srow {
        margin-bottom: 1.0em;
    }
    .fa-info-circle {
        color: blue;
        margin-left: 3px;
    }
</style>