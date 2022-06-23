<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced" style="max-width: 900px">
            <h2 class="twelve columns">{{ $t('aboutAstericsGrid') }}</h2>
            <div>
                <div class="srow">
                    <h3>{{ $t('generalInformation') }}</h3>
                    <div>
                        {{ $t('astericsGridIsFreeAndOpenSource') }}<br/>
                        <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid">{{ $t('astericsGridOnGithub') }}</a><br/><br/>

                        {{ $t('theInitialDevelopmentOfAstericsGridWasDoneAt') }}<br/>
                        <a target="_blank" href="https://embsys.technikum-wien.at/projects/torades/index.php">{{ $t('moreInfoAbouTorades') }}</a><br/><br/>

                        {{ $t('currentDeleopmentAstericsGridIsDoneWBT') }}<br/>
                        <a target="_blank" href="https://embsys.technikum-wien.at/projects/khat/index.php">{{ $t('moreInfoAboutWBT') }}</a>
                        <br/><br/>
                        <a href="https://www.wien.gv.at/kontakte/ma23/" target="_blank" :title="$t('ma23CityOfVienna')"><img src="app/img/ma23-gefoerdertvon.jpg" width="80px" :alt="$t('logoMa23CityVienna')"></a>
                        <br/>

                        <i18n path="arasaacCollaboration" tag="p">
                            <template v-slot:arasaacLink>
                                <a href="https://arasaac.org/" target="_blank">{{ $t('aragoneseCenterOfAAC') }}</a>
                            </template>
                        </i18n>
                        <a href="https://arasaac.org/" aria-hidden="true" target="_blank"><img src="app/img/arasaac.png" width="250px" :alt="$t('logoMa23CityVienna')"></a>
                    </div>
                </div>
                <div class="srow">
                    <h3>{{ $t('feedback') }}</h3>
                    <div>
                        {{ $t('ifYouEncounterAnErrorHaveSuggestions') }}<br/>
                        <a href="mailto:office@asterics-foundation.org">office@asterics-foundation.org</a>
                        <br/><br/>

                        {{ $t('ifYouAreAGithubUserYouAreAlsoWelcomeToFileIssue') }}<br/>
                        <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid/issues/">{{ $t('astericsGridIssuesOnGithub') }}</a>
                        <br/>
                    </div>
                </div>
                <div class="srow">
                    <h3>{{ $t('termsOfServiceAndPrivacyPolicy') }}</h3>
                    <div>
                        <i18n path="astericsGridLicenseInfo" tag="p">
                            <template v-slot:agplLink>
                                <a href="https://github.com/asterics/AsTeRICS-Grid/blob/master/LICENSE" target="_blank">AGPLv3</a>
                            </template>
                        </i18n>
                        <i18n path="ytTermsInfo" tag="p">
                            <template v-slot:ytTerms>
                                <a href="https://www.youtube.com/t/terms" target="_blank">{{ $t('youtubeTermsOfService') }}</a>
                            </template>
                            <template v-slot:googleTerms>
                                <a href="https://policies.google.com/privacy" target="_blank">{{ $t('googlePrivacyPolicy') }}</a>
                            </template>
                            <template v-slot:ytAPI>
                                <a href="https://developers.google.com/youtube/v3" target="_blank">{{ $t('youtubeDataApi') }}</a>
                            </template>
                        </i18n>
                        <i18n path="privacyPolicyInfo" tag="p">
                            <template v-slot:privacyPolicy>
                                <a href="app/privacy_en.html?back=about">{{ $t('privacyPolicy') }}</a>
                            </template>
                            <template v-slot:privacyPolicyDe>
                                <a href="app/privacy_de.html?back=about">{{ $t('privacyPolicy') }}</a>
                            </template>
                        </i18n>
                    </div>

                </div>
                <div class="srow">
                    <h3>{{ $t('acknowledgements') }}</h3>
                    <i18n path="thankCrossbrowsertesting" tag="div">
                        <template v-slot:crossbrowserTestingUrl>
                            <a target="_blank" href="https://crossbrowsertesting.com/">crossbrowsertesting.com</a>
                        </template>
                    </i18n>
                    <a target="_blank" href="https://crossbrowsertesting.com/"><img src="app/img/CBT_OS-logo_2Color-H.png" width="300px"></a><br/>
                    <i18n path="thankResponsiveVoice" tag="div">
                        <template v-slot:responsiveVoiceUrl>
                            <a target="_blank" href="https://responsivevoice.org">ResponsiveVoice.org</a>
                        </template>
                    </i18n>
                    <div><a href="https://responsivevoice.org">ResponsiveVoice-NonCommercial</a> {{ $t('licensedUnder') }} <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/"><img title="ResponsiveVoice Text To Speech" src="https://responsivevoice.org/wp-content/uploads/2014/08/95x15.png" alt="95x15" width="95" height="15" /></a></div>
                </div>
                <div class="srow" style="margin-top: 3em">
                    <i18n path="youreUsingAstericsGridVersion" tag="div">
                        <template v-slot:gridVersion>
                            <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid/releases/tag/#ASTERICS_GRID_VERSION#">#ASTERICS_GRID_VERSION#</a>
                        </template>
                    </i18n>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
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
    .srow {
        margin-bottom: 1.5em;
    }
</style>