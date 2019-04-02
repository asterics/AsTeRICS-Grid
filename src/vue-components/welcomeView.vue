<template>
    <div>
        <header class="row header" role="banner">
            <div id="menuHeader" class="menuHeader">
                <a href="#welcome" class="hide-mobile"><img id="astericsIcon" class="inline" src="img/asterics_icon.png"/><h1 class="inline">AsTeRICS Grid</h1></a>
            </div>
        </header>
        <main role="main" class="row content spaced" @keyup.enter="login()">
            <h2><span class="show-mobile">AsTeRICS Grid - </span><span data-i18n="">Welcome // Willkommen</span></h2>
            <div class="eight columns offset-by-one">
                <div class="row">
                    <h3>AsTeRICS Grid <strong>ohne Registrierung</strong> verwenden</h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Grids werden offline gespeichert</li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>voller Funktionsumfang</li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>optimal für Nutzung auf einem einzelnen Gerät</li>
                    </ul>
                    <button @click="useDefaultUser()">AsTeRICS Grid ohne Registrierung verwenden</button>
                    <div>
                        <span class="fa fa-info-circle"></span><span class="break-word">eine spätere Registrierung ist jederzeit möglich.</span>
                    </div>
                </div>
                <div class="row">
                    <h3>AsTeRICS Grid mit <strong>Registrierung</strong> verwenden</h3>
                    <ul class="fa-ul">
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Grids werden offline und online gespeichert</li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>automatische Synchronisierung zwischen verschiedenen Geräten (z.B. PC, Tablet, Smartphone)</li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Daten werden verschlüsselt und es kann niemand außer Sie darauf zugreifen</li>
                        <li><span class="fa-li"><i class="fas fa-check"></i></span>für die Registrierung wird nur ein Username und ein Passwort benötigt</li>
                    </ul>
                    <button @click="toRegister()">Zur Registrierung</button>
                </div>
                <div class="row">
                    <span data-i18n="">Already have an account? // Sie haben bereits einen Account?</span>
                    <a href="#login" data-i18n="">Login // Zum Login</a>
                </div>
            </div>
        </main>
    </div>
</template>

<script>
    import {I18nModule} from './../js/i18nModule.js';
    import {databaseService} from "../js/service/data/databaseService";
    import {Router} from "../js/router";
    import {constants} from "../js/util/constants";
    import {localStorageService} from "../js/service/data/localStorageService";

    export default {
        props: [],
        data() {
            return {
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
                localStorageService.saveLocalUser(constants.LOCAL_NOLOGIN_USERNAME);
                localStorageService.setAutologinUser(constants.LOCAL_NOLOGIN_USERNAME);
                databaseService.initForUser(constants.LOCAL_NOLOGIN_USERNAME).then(() => {
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