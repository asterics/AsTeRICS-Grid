<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="container px-3 px-md-5 ms-0 col-12 col-md-10 col-xl-9 pt-4 pt-lg-5">
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
                <h2>{{ $t('contactAndFeedback') }}</h2>
                <span>{{ $t('ifYouEncounterAnErrorHaveSuggestions') }}</span>
                <ul>
                    <li>
                        <i18n path="generalSupportSocialMedia" tag="span">
                            <template v-slot:instagramLink>
                                <a href="https://www.instagram.com/asterics_grid/" target="_blank">{{ $t('instagramAstericsGridPage') }}</a>
                            </template>
                            <template v-slot:facebookLink>
                                <a href="https://www.facebook.com/asterics.grid.y.arasaac" target="_blank">{{ $t('facebookAstericsGridPage') }}</a>
                            </template>
                        </i18n>
                        <span>({{ $t('lang.en') }}, {{ $t('lang.es') }})</span>
                    </li>
                    <li>
                        <i18n path="foundBugReportGithubIssue" tag="span">
                            <template v-slot:githubLink>
                                <a href="https://github.com/asterics/AsTeRICS-Grid/issues/new" target="_blank">{{ $t('createAnIssueOnGithub') }}</a>
                            </template>
                        </i18n>
                        <span>({{ $t('lang.en') }})</span>
                    </li>
                    <li>
                        <i18n path="discussIdeasGithubDiscussions" tag="span">
                            <template v-slot:githubLink>
                                <a href="https://github.com/asterics/AsTeRICS-Grid/discussions" target="_blank">{{ $t('postSomethingOnGithubDiscussions') }}</a>
                            </template>
                        </i18n>
                        <span>({{ $t('lang.en') }})</span>
                    </li>
                    <li>
                        <i18n path="specialRequestsSendEmail" tag="span">
                            <template v-slot:foundationEmail>
                                <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>
                            </template>
                        </i18n>
                        <span>({{ $t('lang.en') }}, {{ $t('lang.de') }})</span>
                    </li>
                </ul>
            </div>
        </div>
        <div class="bottom-spacer"></div>
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