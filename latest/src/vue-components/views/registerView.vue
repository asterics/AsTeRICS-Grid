<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span>{{ $t('registerOnlineUser') }}</span></h2>
            <form autocomplete="off" onsubmit="event.preventDefault()" style="margin-bottom: 0.5em">
                <div class="srow">
                    <label for="inputUser" class="two columns"><span class="desktop-right inputlabel">{{ $t('username') }}</span></label>
                    <input type="text" name="username" autocapitalize="none" v-model="user" id="inputUser" class="six columns" @input="validateUsername" v-focus="" maxlength="16"/>
                    <div class="three columns" v-show="user != null && usernameValid === undefined">
                        <i class="fas fa-spinner fa-spin"/>
                    </div>
                    <div class="three columns" v-show="user != null && usernameValid == false">
                        <i style="color: red;" class="fas fa-times"/> <span>{{usernameValidationCode | translate}}</span>
                    </div>
                    <div class="three columns" v-show="user != null && usernameValid == true">
                        <i style="color: green;" class="fas fa-check"/> <span>{{ $t('validUsername') }}</span>
                    </div>
                </div>
                <div class="srow">
                    <label for="inputPassword" class="two columns inputlabel"><span class="desktop-right">{{ $t('password') }}</span></label>
                    <input type="password" v-model="password" id="inputPassword" class="six columns"/>
                </div>
                <div class="srow">
                    <label for="inputConfirmPassword" class="two columns inputlabel"><span class="desktop-right">{{ $t('confirmPassword') }}</span></label>
                    <input type="password" v-model="password2" id="inputConfirmPassword" class="six columns"/>
                    <div class="three columns" v-show="!!password && password2 !== null && password !== password2">
                        <i style="color: red;" class="fas fa-times"/> <span>{{ $t('passwordsDoNotMatch') }}</span>
                    </div>
                    <div class="three columns" v-show="!!password && password2 !== null && password === password2">
                        <i style="color: green;" class="fas fa-check"/> <span>{{ $t('passwordsMatch') }}</span>
                    </div>
                </div>
            </form>

            <div class="srow more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <i class="fas fa-info-circle" style="color: blue"></i>
                    <b>{{ $t('importantInformation') }}</b>
                    <ul style="list-style-type: none; margin-bottom: 0">
                        <li>{{ $t('yourPasswordWillBeUsedInOrderToEncrypt') }}</li>
                        <li>{{ $t('usersWillBeDeletedAfterNotLoggingInFor365Days') }}</li>
                    </ul>
                </div>
            </div>
            <div class="srow more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <input type="checkbox" checked v-model="remember" id="inputRemember"/>
                    <label for="inputRemember"><span>{{ $t('rememberThisUserAndMakeItAvailableForOffline') }}</span></label>
                    <br/>
                    <span class="fa fa-info-circle"/> <span>{{ $t('doNotCheckIfYouAreUsingAForeignDevice') }}</span>
                </div>
            </div>
            <div class="srow more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <input type="checkbox" id="checkPrivacy" v-model="privacyConsent"/>
                    <label for="checkPrivacy">
                        <i18n path="iAcceptPrivacyPolicy" tag="span">
                            <template v-slot:link>
                                <a href="app/privacy_en.html?back=register">{{ $t('privacyPolicy') }}</a>
                            </template>
                            <template v-slot:linkDe>
                                <a href="app/privacy_de.html?back=register">{{ $t('privacyPolicy') }}</a>
                            </template>
                        </i18n>
                    </label>
                    <br/>
                    <span class="fa fa-info-circle"/>
                    <span>
                        <i18n path="theOnlyPersonalDataSavedIs" tag="span">
                            <template v-slot:link>
                                <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>
                            </template>
                        </i18n>
                    </span>
                </div>
            </div>
            <div class="srow">
                <button @click="register" :disabled="!user || !password || !password2 || password !== password2 || !usernameValid || !privacyConsent" class="six columns offset-by-two">{{ $t('register') }}</button>
            </div>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <span>{{ $t('alreadyHaveAnAccount') }}</span>
                    <a href="#login">{{ $t('toLogin') }}</a>
                </div>
            </div>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <span>{{ $t('wantToCreateAnOfflineonlyUser') }}</span>
                    <a href="#add">{{ $t('addOfflineUser') }}</a>
                </div>
            </div>
            <div class="srow">
                <div class="six columns offset-by-two">
                    <div v-show="registerSuccess === undefined">
                        <span>{{ $t('registering') }}</span> <i class="fas fa-spinner fa-spin"/>
                    </div>
                    <div v-show="registerSuccess == false">
                        <span>{{ $t('registeringFailed') }}</span> <i style="color: red" class="fas fa-times"/>
                        <ul>
                            <li v-for="error in validationErrors">{{error}}</li>
                        </ul>
                    </div>
                    <div v-show="registerSuccess == true">
                        <span>{{ $t('successfullyRegistered') }}</span> <i style="color: green" class="fas fa-check"/>
                    </div>
                </div>
            </div>
            <comparison-component></comparison-component>
        </div>
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {loginService} from './../../js/service/loginService.js';
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import ComparisonComponent from "./../components/comparisonComponent.vue";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {util} from "../../js/util/util.js";

    export default {
        components: {ComparisonComponent, HeaderIcon},
        props: [],
        data() {
            return {
                user: null,
                usernameValid: null,
                usernameValidationCode: null,
                password: null,
                password2: null,
                remember: true,
                privacyConsent: false,
                registerSuccess: null,
                creationTime: new Date().getTime(),
                spamTime: 10000,
                validationErrors: []
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            register() {
                let thiz = this;
                let timediff = new Date().getTime() - thiz.creationTime;
                if (timediff < thiz.spamTime) {
                    thiz.validationErrors = [('you were too fast (spambot protection) - please try again in ' + (thiz.spamTime - timediff) + 'ms.')];
                    thiz.registerSuccess = false;
                    return;
                }
                thiz.registerSuccess = undefined;
                loginService.register(this.user, this.password, this.remember).then(() => {
                    log.info('successfully registered!');
                    thiz.registerSuccess = true;
                    Router.toMain();
                }).catch(reason => {
                    thiz.registerSuccess = false;
                    log.warn(reason);
                    if(reason.validationErrors) {
                        thiz.validationErrors = [];
                        Object.keys(reason.validationErrors).forEach(key => {
                            thiz.validationErrors = thiz.validationErrors.concat(reason.validationErrors[key]);
                        });
                    }
                });
            },
            validateUsername() {
                var thiz = this;
                thiz.usernameValid = undefined;
                thiz.usernameValidationCode = null;
                util.debounce(() => {
                    loginService.validateUsername(thiz.user).then((code) => {
                        thiz.usernameValid = code === constants.VALIDATION_VALID;
                        thiz.usernameValidationCode = code;
                    });
                }, 300, 'CHECK_USERNAME');
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

    .more-space {
        margin-bottom: 1.5em !important;
    }

    .fa-info-circle {
        color: blue;
        margin-left: 3px;
    }

    @media (min-width: 850px) {
        .inputlabel {
            text-align: right;
        }
    }
</style>