<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="row content spaced">
            <h2 data-i18n="">About AsTeRICS Grid // Über das AsTeRICS Grid</h2>
            <div class="eight columns offset-by-one">
                <div class="row">
                    <h3 data-i18n="">General information // Allgemeine Informationen</h3>
                    <div data-i18n="">
                        <span>
                            The initial development of AsTeRICS Grid was done at the UAS Technikum Wien within the project ToRaDes, funded by the city of Vienna (project number 18-04).<br/>
                            <a target="_blank" href="https://embsys.technikum-wien.at/projects/torades/index.php">More information about project ToRaDes</a>
                            <br/><br/>

                            AsTeRICS Grid is free and open source and hosted on github.com.<br/>
                            <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid">AsTeRICS Grid on github</a>
                        </span>
                        <span>
                            Die erste Version von AsTeRICS Grid wurde an der FH Technikum Wien im Projekt ToRaDes entwickelt, gefördert von der Stadt Wien (Projektnummer 18-04).<br/>
                            <a target="_blank" href="https://embsys.technikum-wien.at/projects/torades/index.php">Mehr Informationen zum Projekt ToRaDes</a>
                            <br/><br/>

                            AsTeRICS Grid ist kostenlos und OpenSource und als Projekt auf github.com verfügbar.<br/>
                            <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid">AsTeRICS Grid auf github</a>
                        </span>
                    </div><br/>
                    <img src="img/ma23-gefoerdertvon.jpg" width="80px">
                </div>
                <div class="row">
                    <h3>Feedback</h3>
                    <div data-i18n="">
                        <span>
                            If you encounter an error, have suggestions for improvement or any general feedback please don't hesitate to contact us on:<br/>
                            <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>
                            <br/><br/>

                            If you are a github user, you are also welcome to file an issue directly on github:<br/>
                            <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid/issues/">AsTeRICS Grid issues on github</a>
                            <br/>
                        </span>
                        <span>
                            Wenn Sie einen Fehler finden, Verbesserungsvorschläge haben oder allgemeines Feedback rückmelden möchten, kontaktieren Sie uns bitte unter:<br/>
                            <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>
                            <br/><br/>
                            Wenn Sie auf github aktiv sind, können Sie dort ein Issue eintragen:<br/>
                            <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid/issues/">AsTeRICS Grid Issues auf github</a>
                            <br/>
                        </span>
                    </div>
                </div>
                <div class="row">
                    <h3 data-i18n="">Acknowledgements // Dank</h3>
                    <div data-i18n="">
                        <span>
                            We thank <a target="_blank" href="https://crossbrowsertesting.com/">crossbrowsertesting.com</a> for providing us a free open source license.<br/>
                        </span>
                        <span>
                            Wir danken <a target="_blank" href="https://crossbrowsertesting.com/">crossbrowsertesting.com</a> für eine kostenlose OpenSource Lizenz.<br/>
                        </span>
                    </div>
                    <a target="_blank" href="https://crossbrowsertesting.com/"><img src="img/CBT_OS-logo_2Color-H.png" width="300px"></a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {I18nModule} from './../../js/i18nModule.js';
    import {Router} from "../../js/router";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'

    export default {
        components: {HeaderIcon},
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
            }
        },
        mounted() {
            I18nModule.init();
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }

    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .row {
        margin-bottom: 1.5em;
    }
</style>