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
            <form autocomplete="off">
                <div class="row">
                    <label for="inputUser" class="two columns"><span class="desktop-right">Username</span></label>
                    <input type="text" name="username" v-model="user" id="inputUser" class="four columns"/>
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
                    <div class="three columns" v-show="!!password && password2 !== null && password === password2">
                        <i style="color: green;" class="fas fa-check"/> <span data-i18n="">Passwords match // Passwörter stimmen überein</span>
                    </div>
                </div>
            </form>

            <div class="row">
                <div class="four columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <i class="fas fa-2x fa-info-circle" style="color: blue"></i>
                    <span data-i18n="">
                        <span>Your password will be used in order to encrypt your private data, before being synchronized with the cloud. A stronger password means better encryption.</span>
                        <span>Das Password wird verwendet um Ihre privaten Konfigurationsdaten zu verschlüsseln, bevor sie mit der Cloud synchronisiert werden. Ein stärkeres Passwort bedeutet bessere Verschlüsselung.</span>
                    </span>
                </div>
            </div>
            <div class="row">
                <div class="four columns offset-by-two" v-show="!!password && password2 !== null && password === password2">
                    <input type="checkbox" checked v-model="remember" id="inputRemember"/>
                    <label for="inputRemember"><span data-i18n="">Remember this user // Diesen User speichern</span></label>
                    <br/>
                    <span data-i18n="">If checked, the registered user will be remembered and you don't have to provide your credentials every time you use AsTeRICS Grid. // Wenn gewählt, wird der registrierte User lokal gespeichert und die Login-Daten müssen nicht jedes Mal eingegeben werden.</span>
                </div>
            </div>
            <div class="row">
                <button @click="register" :disabled="!user || !password || !password2 || password !== password2" class="four columns offset-by-two" data-i18n="">Register // Registrieren</button>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">Login // Zum Login</a>
                </div>
            </div>
            <div class="row">
                <div class="four columns offset-by-two">
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
                password2: null,
                remember: true,
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
                loginService.register(this.user, this.password).then(() => {
                    log.info('successfully registered!')
                    thiz.registerSuccess = true;
                    //TODO -> logged in
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