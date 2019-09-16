<template>
    <div>
        <accordion acc-label="HEADER_COMPARE_ONLINE_OFFLINE" class="six columns offset-by-two">
            <div>
                <h3 data-i18n="">Offline user // Offline-User</h3>
                <ul class="fa-ul">
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all grids are saved offline // alle Grids werden offline gespeichert</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all functions available // voller Funktionsumfang</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">ideal for using on a single device // optimal für Nutzung auf einem einzelnen Gerät</span></li>
                </ul>
            </div>
            <div>
                <h3 data-i18n="">Online user // Online-User</h3>
                <ul class="fa-ul">
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all grids are saved offline and online // alle Grids werden offline und online gespeichert</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">automatic synchronization across multiple devices (e.g. PC, tablet, smartphone) // automatische Synchronisierung zwischen verschiedenen Geräten (z.B. PC, Tablet, Smartphone)</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">all data is end-to-end encrypted and only you are able to access it // alle Daten werden verschlüsselt und es kann niemand außer Sie darauf zugreifen</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span data-i18n="">for registration only a username and a password is needed // für die Registrierung wird nur ein Username und ein Passwort benötigt</span></li>
                </ul>
            </div>
        </accordion>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import Accordion from "./accordion.vue"

    export default {
        props: [],
        components: {
            Accordion
        },
        data() {
            return {
                showInfo: false
            }
        },
        methods: {
        },
        mounted() {
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    h3 {
        margin: 0;
        padding-bottom: 0.5em;
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
</style>