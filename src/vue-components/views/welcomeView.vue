<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
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
                <div class="row">
                    <b data-i18n="">Hint: // Hinweis:</b>
                    <span>
                        <span data-i18n="">If you need help within AsTeRICS Grid, just click the help icon ( // Wenn Sie Hilfe bei der Verwendung von AsTeRICS Grid benötigen, klicken Sie einfach auf das Hilfe-Icon (</span>
                        <a href="javascript:;" @click="openHelp"><i class="fas fa-question-circle"></i></a>
                        <span data-i18n="">) or press [F1] on the keyboard in order to open the user documentation at the relevant part. // ) oder drücken Sie [F1] auf der Tastatur um die Benutzerdokumentation an der entsprechenden Stelle zu öffnen.</span>
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {databaseService} from "../../js/service/data/databaseService";
    import {Router} from "../../js/router";
    import {constants} from "../../js/util/constants";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {helpService} from "../../js/service/helpService";
    import {loginService} from "../../js/service/loginService";

    export default {
        components: {HeaderIcon},
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
                loginService.registerOffline(constants.LOCAL_NOLOGIN_USERNAME, constants.LOCAL_NOLOGIN_USERNAME).then(() => {
                    Router.toMain();
                });
            },
            openHelp() {
                helpService.openHelp();
            }
        },
        mounted() {
            i18nService.initDomI18n();
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
        color: #266697;
        margin-right: 0.5em;
    }
    button {
        background-color: lightblue;
        padding: 0.7em;
        border-radius: 10px;
        font-size: 1.3em;
    }
    @media (max-width: 850px) {
        button {
            width: 100%;
        }
    }
    @media (min-width: 850px) {
        button {
            width: 30em;
        }
    }
</style>