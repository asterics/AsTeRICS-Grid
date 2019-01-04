<template>
    <div>
        <header class="row header" role="banner">
            <div id="menuHeader" class="menuHeader">
                <a href="#main" class="hide-mobile"><img id="astericsIcon" class="inline" src="img/asterics_icon.png"/><h1 class="inline">AsTeRICS Ergo Grid</h1></a>
                <div id="buttons" class="menuButtons inline-desktop spaced-desktop">
                    <div>
                        <button @click="toMain()" title="Back"><i class="fas fa-angle-left"></i> <span data-i18n>Back // Zurück</span></button>
                    </div>
                </div>
            </div>
        </header>
        <main role="main" class="row content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Register // Registrieren</span></h2>
            <form autocomplete="on">
                <div class="row">
                    <label for="inputUser" class="two columns"><span class="desktop-right">E-Mail</span></label>
                    <input type="email" name="email" v-model="email" id="inputUser" class="four columns"/>
                </div>
                <div class="row">
                    <label for="inputPassword" class="two columns"><span class="desktop-right" data-i18n="">Password // Passwort</span></label>
                    <input type="password" v-model="password" id="inputPassword" class="four columns"/>
                </div>
                <div class="row">
                    <label for="inputConfirmPassword" class="two columns"><span class="desktop-right" data-i18n="">Confirm password // Passwort wiederholen</span></label>
                    <input type="password" v-model="password2" id="inputConfirmPassword" class="four columns"/>
                    <div class="three columns" v-show="!!password && password2 !== null && password !== password2">
                        <i style="color: red;" class="fas fa-times"/> <span data-i18n="">Passwords do not match // Passwörter stimmen nicht überein</span>
                    </div>
                </div>
            </form>

            <div class="row">
                <div class="four columns offset-by-two">
                    <span data-i18n="">
                        <span>AsTeRICS Grid is free and we will not use your email address for any other purpose than identifying and activating your account.</span>
                        <span>AsTeRICS Grid ist kostenlos und wir werden Ihre E-Mail Adresse nur zum Identifizieren und Aktivieren Ihres Accounts verwenden.</span>
                    </span>
                </div>
            </div>
            <div class="row">
                <button @click="login" :disabled="!email || !password || !password2 || password !== password2" class="four columns offset-by-two" data-i18n="">Register // Registrieren</button>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">To Login // Zum Login</a>
                </div>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
                    <div v-show="loginSuccess === undefined">
                        <span data-i18n="">Registering // Registriere</span> <i class="fas fa-spinner fa-spin"/>
                    </div>
                    <div v-show="loginSuccess == false">
                        <span data-i18n="">Registering failed // Registrierung fehlgeschlagen</span> <i style="color: red" class="fas fa-times"/>
                    </div>
                    <div v-show="loginSuccess == true">
                        <span data-i18n="">Successfully registered // Registrierung erfolgreich</span> <i style="color: green" class="fas fa-check"/>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import {I18nModule} from './../js/i18nModule.js';
    import {loginService} from './../js/service/loginService.js';

    export default {
        props: [],
        data() {
            return {
                email: null,
                password: null,
                password2: null,
                loginSuccess: null
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            login() {
                var thiz = this;
                thiz.loginSuccess = undefined;
                loginService.register(this.email, this.password).then(loginSuccess => {
                    thiz.loginSuccess = loginSuccess;
                    log.warn(loginSuccess)
                });
            }
        },
        mounted() {
            I18nModule.init();
        },
        updated() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .row {
        margin-bottom: 1.0em;
    }
</style>