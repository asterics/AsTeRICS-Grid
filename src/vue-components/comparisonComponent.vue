<template>
    <div>
        <div>
            <h3 data-i18n="">Offline user // Offline-User</h3>
            <ul class="fa-ul">
                <!-- TODO: translate -->
                <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Grids werden offline gespeichert</li>
                <li><span class="fa-li"><i class="fas fa-check"></i></span>voller Funktionsumfang</li>
                <li><span class="fa-li"><i class="fas fa-check"></i></span>optimal für Nutzung auf einem einzelnen Gerät</li>
            </ul>
        </div>
        <div>
            <h3 data-i18n="">Online user // Online-User</h3>
            <ul class="fa-ul">
                <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Grids werden offline und online gespeichert</li>
                <li><span class="fa-li"><i class="fas fa-check"></i></span>automatische Synchronisierung zwischen verschiedenen Geräten (z.B. PC, Tablet, Smartphone)</li>
                <li><span class="fa-li"><i class="fas fa-check"></i></span>alle Daten werden verschlüsselt und es kann niemand außer Sie darauf zugreifen</li>
                <li><span class="fa-li"><i class="fas fa-check"></i></span>für die Registrierung wird nur ein Username und ein Passwort benötigt</li>
            </ul>
        </div>
    </div>
</template>

<script>
    import {I18nModule} from './../js/i18nModule.js';

    export default {
        props: [],
        data() {
            return {
            }
        },
        methods: {
        },
        mounted() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    h3 {
        margin-bottom: 0.5em;
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