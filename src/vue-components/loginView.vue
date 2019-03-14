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
        <main role="main" class="row content spaced" @keyup.enter="login()">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Login // Einloggen</span></h2>
            <div class="eleven columns offset-by-one">
                <div v-show="savedUsers.length > 0">
                    <div class="row">
                        <div class="seven columns saved-user">
                            <div class="row" v-for="username in savedUsers" style="margin-bottom: 0">
                                <strong class="four columns" style="margin-bottom: 0.5em"><i class="fas fa-user fa-2x" style="margin-right: 0.6em"></i>{{username}}</strong>
                                <button class="four columns" @click="loginStored(username)">
                                    <span>Login</span> <i class="fas fa-sign-in-alt"></i>
                                </button>
                                <button class="four columns" @click="removeStoredUser(username)">
                                    <span data-i18n="">Unlink // Entfernen </span><i class="fas fa-unlink"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <form autocomplete="on" class="seven columns saved-user">
                            <div class="row">
                                <strong data-i18n="">Login with other user // Login mit anderem User</strong>
                            </div>
                            <div class="row">
                                <label for="inputUser" class="two columns"><span>Username</span></label>
                                <input type="text" name="username" v-model="user" id="inputUser" class="four columns" autocomplete="username"/>
                            </div>
                            <div class="row">
                                <label for="inputPassword" class="two columns"><span data-i18n="">Password // Passwort</span></label>
                                <input type="password" v-model="password" id="inputPassword" class="four columns" autocomplete="current-password"/>
                            </div>
                            <div class="row">
                                <div class="four columns offset-by-two" style="margin-bottom: 1.0em">
                                    <input type="checkbox" checked v-model="remember" id="inputRemember"/>
                                    <label for="inputRemember"><span data-i18n="">Remember this user // Diesen User speichern</span></label>
                                </div>
                                <button @click="loginPlain(user, password)" :disabled="!user || !password" class="five columns offset-by-one">
                                    <span data-i18n="">Login // Einloggen</span>
                                    <span>
                                    <i class="fas fa-spinner fa-spin" v-show="loginSuccess === undefined"/>
                                    <i style="color: red" class="fas fa-times" v-show="loginSuccess == false"/>
                                    <i style="color: green" class="fas fa-check" v-show="loginSuccess == true"/>
                                </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                <div v-show="savedUsers.length == 0">
                    <form autocomplete="on">
                        <div class="row">
                            <label for="inputUser2" class="one column"><span class="desktop-right">Username</span></label>
                            <input type="text" name="username" v-model="user" id="inputUser2" class="four columns" autocomplete="username" v-focus="!user"/>
                        </div>
                        <div class="row">
                            <label for="inputPassword2" class="one column"><span class="desktop-right" data-i18n="">Password // Passwort</span></label>
                            <input type="password" v-model="password" id="inputPassword2" class="four columns" autocomplete="current-password" v-focus="!!user"/>
                        </div>
                        <div class="row">
                            <div class="four columns offset-by-one">
                                <input type="checkbox" checked v-model="remember" id="inputRemember2"/>
                                <label for="inputRemember2"><span data-i18n="">Remember this user // Diesen User speichern</span></label>
                                <br/>
                                <span data-i18n="">If checked, the registered user will be remembered and you don't have to provide your credentials every time you use AsTeRICS Grid. // Wenn gewählt, wird der registrierte User lokal gespeichert und die Login-Daten müssen nicht jedes Mal eingegeben werden.</span>
                            </div>
                        </div>
                    </form>
                    <div class="row">
                        <button @click="loginPlain(user, password)" :disabled="!user || !password" class="four columns offset-by-one" data-i18n="">Login // Einloggen</button>
                    </div>
                    <div class="row">
                        <div class="four columns offset-by-one">
                            <div v-show="loginSuccess === undefined">
                                <span data-i18n="">Logging in // Einloggen</span> <i class="fas fa-spinner fa-spin"/>
                            </div>
                            <div v-show="loginSuccess == false">
                                <i style="color: red" class="fas fa-times"/>
                                <span data-i18n="">Login failed, wrong username or password // Login fehlgeschlagen, falscher Benutzername oder Passwort </span>
                            </div>
                            <div v-show="loginSuccess == true">
                                <span data-i18n="">Login successful // Login erfolgreich</span> <i style="color: green" class="fas fa-check"/>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="twelve columns">
                        <span v-show="savedUsers.length == 0" data-i18n="">No account? // Kein Account?</span>
                        <span v-show="savedUsers.length > 0" data-i18n="">Add new account? // Weiteren Account hinzufügen?</span>
                        <a href="#register" data-i18n="">Register now // Jetzt registrieren</a>
                        <div>
                            <span data-i18n="">AsTeRICS Grid is free and all you need is to register is a username and a password. // AsTeRICS Grid ist kostenlos und Sie benötigen nur einen Usernamen und ein Passwort.</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import {I18nModule} from './../js/i18nModule.js';
    import {loginService} from './../js/service/loginService.js';
    import {databaseService} from "../js/service/data/databaseService";
    import {localStorageService} from "../js/service/data/localStorageService";
    import {Router} from "../js/router";

    export default {
        props: [],
        data() {
            return {
                user: null,
                password: null,
                remember: false,
                loginSuccess: null,
                savedUsers: [],
            }
        },
        methods: {
            toMain() {
                Router.toMain();
            },
            loginPlain(user, password) {
                let thiz = this;
                if (!user || !password) {
                    return;
                }
                thiz.loginSuccess = undefined;
                loginService.loginPlainPassword(user, password, this.remember).then(loginSuccess => {
                    thiz.loginSuccess = loginSuccess;
                    if (loginSuccess) {
                        databaseService.updateUser().then(() => {
                            Router.toMain();
                        });
                    }
                });
            },
            loginStored(user) {
                let thiz = this;
                if (!user) {
                    return;
                }
                let password = localStorageService.getUserPassword(user);
                loginService.loginHashedPassword(user, password, false).then(loginSuccess => {
                    if (loginSuccess) {
                        databaseService.updateUser().then(() => {
                            Router.toMain();
                        });
                    }
                });
            },
            removeStoredUser(user) {
                //TODO: i18n message
                //TODO: remove database
                if(confirm('Do you really want to unlink this account? This will not delete the account itself, but all locally stored data of it.')) {
                    localStorageService.removeUserPassword(user);
                    this.savedUsers = localStorageService.getSavedUsers();
                }
            }
        },
        mounted() {
            this.savedUsers = localStorageService.getSavedUsers();
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
    .saved-user {
        outline: 1px solid lightgray;
        padding: 1.0em;
    }
</style>