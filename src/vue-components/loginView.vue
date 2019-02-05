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
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Login // Einloggen</span></h2>
            <form autocomplete="on">
                <div class="row">
                    <label for="inputUser" class="two columns"><span class="desktop-right">Username</span></label>
                    <input type="text" name="username" v-model="user" id="inputUser" class="four columns" autocomplete="username"/>
                </div>
                <div class="row">
                    <label for="inputPassword" class="two columns"><span class="desktop-right" data-i18n="">Password // Passwort</span></label>
                    <input type="password" v-model="password" id="inputPassword" class="four columns" autocomplete="current-password"/>
                </div>
            </form>
            <div class="row">
                <button @click="login" :disabled="!user || !password" class="four columns offset-by-two" data-i18n="">Login // Einloggen</button>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
                    <span data-i18n="">No account? // Kein Account?</span>
                    <a href="#register" data-i18n="">Register now // Jetzt registrieren</a>
                    <div>
                        <span data-i18n="">AsTeRICS Grid is free and all you need is to register is a username and a password. // AsTeRICS Grid ist kostenlos und Sie benötigen nur einen Usernamen und ein Passwort.</span>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
                    <div v-show="loginSuccess === undefined">
                        <span data-i18n="">Logging in // Einloggen</span> <i class="fas fa-spinner fa-spin"/>
                    </div>
                    <div v-show="loginSuccess == false">
                        <span data-i18n="">Login failed // Login fehlgeschlagen</span> <i style="color: red" class="fas fa-times"/>
                    </div>
                    <div v-show="loginSuccess == true">
                        <span data-i18n="">Login successful // Login erfolgreich</span> <i style="color: green" class="fas fa-check"/>
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
                user: null,
                password: null,
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
                loginService.login(this.user, this.password).then(loginSuccess => {
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