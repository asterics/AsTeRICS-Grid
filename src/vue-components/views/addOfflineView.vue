<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Add&nbsp;offline&nbsp;user // Offline&#8209;User&nbsp;hinzufügen</span></h2>
            <form autocomplete="off" onsubmit="event.preventDefault()">
                <div class="row">
                    <label for="inputUser" class="two columns"><span class="desktop-right">Username</span></label>
                    <input type="text" name="username" v-model="user" id="inputUser" class="six columns" @input="validationError = undefined" @change="validateUsername" v-debounce="300" v-focus=""/>
                    <div class="three columns" v-show="user != '' && validationError">
                        <i style="color: red;" class="fas fa-times"/> <span data-i18n="">{{validationError | translate}}</span>
                    </div>
                    <div class="three columns" v-show="user && validationError !== undefined && !validationError">
                        <i style="color: green;" class="fas fa-check"/> <span data-i18n="">Valid username // Username OK</span>
                    </div>
                </div>
            </form>
            <div class="row">
                <div class="six columns offset-by-two">
                    <i class="fas fa-2x fa-info-circle" style="color: blue"></i>
                    <span data-i18n="">
                        <span>A local user is stored only on this device, in this browser. If you want to set up a user which is synchronized across several devices using the cloud, you can register an online user.</span>
                        <span>Ein lokaler User ist nur auf diesem Gerät, in diesem Browser gespeichert. Wenn Sie einen User erstellen möchen, der auf verschiedenen Geräten synchronisiert wird, registrieren Sie einen Online-User.</span>
                    </span>
                </div>
            </div>
            <div class="row">
                <button @click="addUser" :disabled="!user || validationError === undefined || validationError" class="six columns offset-by-two">
                    <span data-i18n="">Add user // User hinzufügen</span>&nbsp;&nbsp;<i v-if="loading" class="fas fa-spinner fa-spin"></i>
                </button>
            </div>
            <div class="row">
                <div class="six columns offset-by-two">
                    <span data-i18n="">Want to register an online user devices? // Möchten Sie einen Online-User registrieren?</span>
                    <a href="#register" data-i18n="">Register // Zur&nbsp;Registrierung</a>
                </div>
            </div>
            <div class="row">
                <div class="six columns offset-by-two">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">Login // Zum&nbsp;Login</a>
                </div>
            </div>
            <comparison-component></comparison-component>
        </div>
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
                    Router.toMain();
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
            i18nService.initDomI18n();
        },
        updated() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }
    .row {
        margin-bottom: 1.0em;
    }
    .fa-info-circle {
        color: blue;
        margin-left: 3px;
    }
</style>