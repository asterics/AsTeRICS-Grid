<template>
    <div>
        <header-icon full-header="true"></header-icon>
        <div class="container ms-0">
            <div class="row ps-2 ps-sm-3 ps-md-4 col-12 col-md-10 col-xl-8 mt-0">
                <h1>Help</h1>
                <div>
                    <span>The following ressources for help on AsTeRICS Grid are available</span>:
                </div>
                <ul>
                    <li><a href="https://www.asterics.eu/manuals/asterics-grid/" target="_blank">User manual <span>({{ 'lang.en' | translate }})</span></a></li>
                    <li v-if="currentLang !== 'es'"><a href="https://aulaabierta.arasaac.org/en/asterics-grid_home" target="_blank">ARASAAC tutorial <span>({{ 'lang.en' | translate }})</span></a></li>
                    <li v-if="currentLang === 'es'"><a href="https://aulaabierta.arasaac.org/asterics-grid_inicio" target="_blank">ARASAAC tutorial <span>({{ 'lang.es' | translate }})</span></a></li>
                    <li><a href="https://www.youtube.com/playlist?list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz" target="_blank">Tutorial videos on YouTube <span>({{ 'lang.de' | translate }})</span></a></li>
                    <li><a href="https://www.youtube.com/channel/UCVIQETg6tIMu3SdEHaIftIw/videos" target="_blank">Tutorial videos on YouTube by Jim Luther <span>({{ 'lang.en' | translate }})</span></a></li>
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
</style>