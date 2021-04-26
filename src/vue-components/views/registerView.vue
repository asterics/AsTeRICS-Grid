<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Register online user // Online-User registrieren</span></h2>
            <form autocomplete="off" onsubmit="event.preventDefault()" style="margin-bottom: 0.5em">
                <div class="row">
                    <label for="inputUser" class="two columns"><span class="desktop-right inputlabel">Username</span></label>
                    <input type="text" name="username" v-model="user" id="inputUser" class="six columns" @change="validateUsername" v-debounce="300" v-focus=""/>
                    <div class="three columns" v-show="user != null && usernameValid == false">
                        <i style="color: red;" class="fas fa-times"/> <span>{{usernameValidationCode | translate}}</span>
                    </div>
                    <div class="three columns" v-show="user != null && usernameValid == true">
                        <i style="color: green;" class="fas fa-check"/> <span data-i18n="">Valid username // Username OK</span>
                    </div>
                </div>
                <div class="row">
                    <label for="inputPassword" class="two columns inputlabel"><span class="desktop-right" data-i18n="">Password // Passwort</span></label>
                    <input type="password" v-model="password" id="inputPassword" class="six columns"/>
                </div>
                <div class="row">
                    <label for="inputConfirmPassword" class="two columns inputlabel"><span class="desktop-right" data-i18n="">Confirm password // Passwort wiederholen</span></label>
                    <input type="password" v-model="password2" id="inputConfirmPassword" class="six columns"/>
                    <div class="three columns" v-show="!!password && password2 !== null && password !== password2">
                        <i style="color: red;" class="fas fa-times"/> <span data-i18n="">Passwords do not match // Passwörter stimmen nicht überein</span>
                    </div>
                    <div class="three columns" v-show="!!password && password2 !== null && password === password2">
                        <i style="color: green;" class="fas fa-check"/> <span data-i18n="">Passwords match // Passwörter stimmen überein</span>
                    </div>
                </div>
            </form>

            <div class="row more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <i class="fas fa-2x fa-info-circle" style="color: blue"></i>
                    <span data-i18n="">
                        <span>Your password will be used in order to encrypt your private data, before being synchronized with the cloud. A stronger password means better encryption.</span>
                        <span>Das Passwort wird verwendet um Ihre privaten Konfigurationsdaten zu verschlüsseln, bevor sie mit der Cloud synchronisiert werden. Ein stärkeres Passwort bedeutet bessere Verschlüsselung.</span>
                    </span>
                </div>
            </div>
            <div class="row more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <input type="checkbox" checked v-model="remember" id="inputRemember"/>
                    <label for="inputRemember"><span data-i18n="">Remember this user and make it available for offline use // Diesen User speichern und offline verfügbar machen</span></label>
                    <br/>
                    <span class="fa fa-info-circle"/> <span data-i18n="">Do not check if you are using a foreign device. // Auf einem fremden Gerät sollte der User nicht gespeichert werden.</span>
                </div>
            </div>
            <div class="row more-space">
                <div class="six columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <input type="checkbox" id="checkPrivacy" v-model="privacyConsent"/>
                    <label for="checkPrivacy" data-i18n="">
                        <span>I accept the <a href="app/privacy_en.html?back=register">privacy policy</a></span>
                        <span>Ich akzeptiere die <a href="app/privacy_de.html?back=register">Datenschutzbestimmungen</a></span>
                    </label>
                    <br/>
                    <span class="fa fa-info-circle"/>
                    <span data-i18n="">
                        <span>
                            The only potentially personal data that is saved unencrypted is your username. All other data
                            will be end-to-end encrypted cannot be accessed by anyone else. The consent can be revoked at
                            any time by sending an email to <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>.
                            Revocation does not affect the legality of data processing that has taken place before.
                        </span>
                        <span>
                            Der einzige potentiell personenbezogene Datenwert, welcher unverschlüsselt gespeichert wird,
                            ist der Username. Alle anderen Daten werden Ende-zu-Ende verschlüsselt und können von niemand
                            anderem eingesehen werden. Die Einwilligung kann jederzeit durch eine Mail an
                            <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a> widerrufen werden.
                            Durch den Widerruf wird die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung nicht berührt.
                        </span>
                    </span>
                </div>
            </div>
            <div class="row">
                <button @click="register" :disabled="!user || !password || !password2 || password !== password2 || !usernameValid || !privacyConsent" class="six columns offset-by-two" data-i18n="">Register // Registrieren</button>
            </div>
            <div class="row">
                <div class="six columns offset-by-two">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">Login // Zum&nbsp;Login</a>
                </div>
            </div>
            <div class="row">
                <div class="six columns offset-by-two">
                    <span data-i18n="">Want to create an offline-only user? // Möchten Sie einen Offline-User erstellen?</span>
                    <a href="#add" data-i18n="">Add&nbsp;offline&nbsp;user // Offline&#8209;User&nbsp;hinzufügen</a>
                </div>
            </div>
            <div class="row">
                <div class="six columns offset-by-two">
                    <div v-show="registerSuccess === undefined">
                        <span data-i18n="">Registering // Registriere</span> <i class="fas fa-spinner fa-spin"/>
                    </div>
                    <div v-show="registerSuccess == false">
                        <span data-i18n="">Registering failed // Registrierung fehlgeschlagen</span> <i style="color: red" class="fas fa-times"/>
                        <ul>
                            <li v-for="error in validationErrors">{{error}}</li>
                        </ul>
                    </div>
                    <div v-show="registerSuccess == true">
                        <span data-i18n="">Successfully registered // Registrierung erfolgreich</span> <i style="color: green" class="fas fa-check"/>
                    </div>
                </div>
            </div>
            <comparison-component></comparison-component>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {loginService} from './../../js/service/loginService.js';
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import ComparisonComponent from "./../components/comparisonComponent.vue";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'

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
                loginService.validateUsername(thiz.user).then((code) => {
                    thiz.usernameValid = code === constants.VALIDATION_VALID;
                    thiz.usernameValidationCode = code;
                });
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