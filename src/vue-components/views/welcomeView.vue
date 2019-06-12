<template>
    <div class="overflow-content">
        <header class="row header" role="banner">
            <div id="menuHeader" class="menuHeader">
                <a href="#welcome" class="hide-mobile"><img id="astericsIcon" class="inline" src="img/asterics_icon.png"/><h1 class="inline">AsTeRICS Grid</h1></a>
            </div>
        </header>
        <div class="row content spaced">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Welcome // Willkommen</span></h2>
            <div class="eight columns offset-by-one">
                <div class="row">
                    <h3 data-i18n="">
                        <span>Use AsTeRICS Grid <strong>without registration</strong></span>
                        <span>AsTeRICS Grid <strong>ohne Registrierung</strong> verwenden</span>
                    </h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all grids are saved offline // alle Grids werden offline gespeichert</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all functions available // voller Funktionsumfang</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">ideal for using on a single device // optimal für Nutzung auf einem einzelnen Gerät</span></li>
                    </ul>
                    <button @click="useDefaultUser()">
                        <span data-i18n="">Use AsTeRICS Grid without registration // AsTeRICS Grid ohne Registrierung verwenden</span>&nbsp;&nbsp;<i v-if="loading" class="fas fa-spinner fa-spin"></i>
                    </button>
                    <div>
                        <span class="fa fa-info-circle"></span><span class="break-word" data-i18n="">it's always possible to register later. // eine spätere Registrierung ist jederzeit möglich.</span>
                    </div>
                </div>
                <div class="row">
                    <h3 data-i18n="">
                        <span>Use AsTeRICS Grid <strong>with registration</strong></span>
                        <span>AsTeRICS Grid <strong>mit Registrierung</strong> verwenden</span>
                    </h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all grids are saved offline and online // alle Grids werden offline und online gespeichert</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">automatic synchronization across multiple devices (e.g. PC, tablet, smartphone) // automatische Synchronisierung zwischen verschiedenen Geräten (z.B. PC, Tablet, Smartphone)</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all data is end-to-end encrypted and only you are able to access it // alle Daten werden verschlüsselt und es kann niemand außer Sie darauf zugreifen</span></li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">for registration only a username and a password is needed // für die Registrierung wird nur ein Username und ein Passwort benötigt</span></li>
                    </ul>
                    <button @click="toRegister()" data-i18n="">Register now // Zur Registrierung</button>
                </div>
                <div class="row">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">Login // Zum&nbsp;Login</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {I18nModule} from './../../js/i18nModule.js';
    import {databaseService} from "../../js/service/data/databaseService";
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import {localStorageService} from "../../js/service/data/localStorageService";

    export default {
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
                localStorageService.saveLocalUser(constants.LOCAL_NOLOGIN_USERNAME);
                localStorageService.setAutologinUser(constants.LOCAL_NOLOGIN_USERNAME);
                databaseService.registerForUser(constants.LOCAL_NOLOGIN_USERNAME, constants.LOCAL_NOLOGIN_USERNAME).then(() => {
                    Router.toMain();
                });
            }
        },
        mounted() {
            I18nModule.init();
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
    .row {
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
        color: blue;
        margin-right: 0.5em;
    }
    button {
        background-color: lightblue;
        padding: 0.7em;
        border-radius: 10px;
        font-size: 1.3em;
    }
    @media (max-width: 750px) {
        button {
            width: 100%;
        }
    }
    @media (min-width: 750px) {
        button {
            width: 30em;
        }
    }
</style>