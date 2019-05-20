<template>
    <footer>
        <div class="footer row">
            <span class="two columns" data-i18n="">Navigation</span>
            <a href="#main" class="two columns" data-i18n="">Main // Hauptseite</a>
            <a href="#login" class="two columns" data-i18n="">Login // Einloggen</a>
            <a href="#register" class="two columns" data-i18n="">Register // Registrierung</a>
            <a href="#add" class="two columns" data-i18n="">Add offline user // Offline-User hinzufügen</a>
            <a href="#about" class="two columns" data-i18n="">About // Infos</a>
        </div>
    </footer>
</template>

<script>
    import {I18nModule} from './../../js/i18nModule.js';

    export default {
        props: [],
        data() {
            return {}
        },
        methods: {
        },
        mounted() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .footer {
        flex-shrink: 0;
        left: 0;
        bottom: 0;
        width: 100%;
        border-top: lightgray solid 2px;
        text-align: center;
        padding-top: 1.0em;
        padding-bottom: 1.0em;
        background-color: white;
    }
</style>