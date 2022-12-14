<template>
    <div>
        <header-icon full-header="true"></header-icon>
        <div class="container px-3 px-md-5 ms-0 col-12 col-md-10 col-xl-9 pt-4 pt-lg-5 mb-5 overflow-content">
            <div class="row">
                <h1>{{ $t('help') }}</h1>
                <div>
                    <span>{{ $t('theFollowingRessourcesForHelpOnAstericsGrid') }}</span>:
                </div>
                <ul>
                    <li><a href="https://www.asterics.eu/manuals/asterics-grid/" target="_blank">{{ $t('userManual') }} <span>({{ 'lang.en' | translate }})</span></a></li>
                    <li v-if="currentLang !== 'es'"><a href="https://aulaabierta.arasaac.org/en/asterics-grid_home" target="_blank">{{ $t('arasaacTutorial') }} <span>({{ 'lang.en' | translate }})</span></a></li>
                    <li v-if="currentLang === 'es'"><a href="https://aulaabierta.arasaac.org/asterics-grid_inicio" target="_blank">{{ $t('arasaacTutorial') }} <span>({{ 'lang.es' | translate }})</span></a></li>
                    <li><a href="https://www.youtube.com/playlist?list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz" target="_blank"><span>{{ $t('tutorialVideosOnYoutube') }}</span> <span>({{ 'lang.de' | translate }})</span></a></li>
                    <li><a href="https://www.youtube.com/channel/UCVIQETg6tIMu3SdEHaIftIw/videos" target="_blank"><span>{{ $t('tutorialVideosOnYoutube') }}</span> <span>(Jim Luther, {{ 'lang.en' | translate }})</span></a></li>
                </ul>
            </div>
            <div class="row">
                <h2>Contact and Feedback</h2>
                <span>{{ $t('ifYouEncounterAnErrorHaveSuggestions') }}</span>
                <ul>
                    <li>For <b>general support and questions</b> please send us a message at the <a href="https://www.instagram.com/asterics_grid/" target="_blank">Instagram AsTeRICS Grid page</a> or the <a href="https://www.facebook.com/asterics.grid.y.arasaac" target="_blank">Facebook AsTeRICS Grid page</a></li>
                    <li>If you <b>found a bug</b> or have a <b>feature request</b>, please <a href="https://github.com/asterics/AsTeRICS-Grid/issues/new" target="_blank">create an issue on GitHub</a></li>
                    <li>To <b>discuss ideas</b> for upcoming features, <b>share usage examples</b> or <b>get in contact</b> with other users, please <a href="https://github.com/asterics/AsTeRICS-Grid/discussions" target="_blank">post something on GitHub Discussions</a></li>
                    <li>
                        For <b>special requests</b> or just to say thanks, you can also contact us by email:
                        <ul class="ms-0 ps-0" style="list-style-type: none">
                            <li>AsTeRICS Foundation, creators of AsTeRICS Grid: <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a></li>
                            <li>ARASAAC, creators of the ARASAAC pictograms and collaborators for AsTeRICS Grid development: <a href="mailto:arasaac@aragon.es">arasaac@aragon.es</a></li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {i18nService} from "../../js/service/i18nService.js";

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                currentLang: i18nService.getAppLang()
            }
        },
        methods: {
        },
        mounted() {
        }
    }
</script>

<style scoped>
    h2, h1 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
        margin-top: 1.5em;
    }
    li {
        margin-top: 0.5em;
    }
    ul {
        list-style-position: outside;
        padding-left: 2em;
        margin-top: 1em;
    }
</style>