<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced" style="max-width: 900px">
            <h2 class="twelve columns">{{ $t('aboutAstericsGrid') }}</h2>
            <div>
                <div class="srow">
                    <h3 class="mt-2">{{ $t('generalInformation') }}</h3>
                    <div>
                        {{ $t('astericsGridIsFreeAndOpenSource') }}<br/>
                        <a target="_blank" href="https://github.com/asterics/AsTeRICS-Grid">{{ $t('astericsGridOnGithub') }}</a><br/><br/>
                    </div>
                    <div>
                        <span>{{ $t('astericsGridWasFundedWithinProjects') }}</span>:
                        <ul class="mt-3 mb-2" style="list-style-type: none">
                            <project-acknowledgement name-link="https://embsys.technikum-wien.at/projects/torades/index.php" name-label="Toolbox for Rapid Design of Smart Homes and Assistive Technologies (ToRaDes)"
                                                     host-link="https://www.technikum-wien.at/" host-label="UAS Technikum Wien // FH Technikum Wien"
                                                     fund-link="https://www.wien.gv.at/kontakte/ma23/index.html" fund-label="City of Vienna // Stadt Wien"
                                                     timespan="2018-2019" additional-info="Project 18-04 // Projekt 18-04"/>
                            <project-acknowledgement name-link="https://embsys.technikum-wien.at/projects/khat/index.php" name-label="Knowledge Hub for Accessible Technologies (WBT) // Wissensdrehscheibe für Barrierefreie Technologien (WBT)"
                                                     host-link="https://www.technikum-wien.at/" host-label="UAS Technikum Wien // FH Technikum Wien"
                                                     fund-link="https://www.wien.gv.at/kontakte/ma23/index.html" fund-label="City of Vienna // Stadt Wien"
                                                     timespan="2019-2023" additional-info="Project 26-02 // Projekt 26-02"/>
                            <project-acknowledgement name-link="https://www.technikum-wien.at/forschungsprojekte/inclusion-international/" name-label="Inclusion International (In2)"
                                                     host-link="https://www.technikum-wien.at/" host-label="UAS Technikum Wien // FH Technikum Wien"
                                                     fund-link="https://www.wien.gv.at/kontakte/ma23/index.html" fund-label="City of Vienna // Stadt Wien"
                                                     timespan="2012-2025" additional-info="Project 33-02 // Projekt 33-02"/>
                            <project-acknowledgement name-link="https://www.netidee.at/asterics-grid" name-label="netidee project funding // netidee Projektförderung"
                                                     fund-link="https://www.internetstiftung.at/" fund-label="Internet Foundation Austria // Internet Privatstiftung Austria"
                                                     timespan="2024-2025" additional-info="Call 18"/>
                            <project-acknowledgement name-link="https://www.technikum-wien.at/forschungsprojekte/indiko/" name-label="Inclusion via digital augmentative and alternative communication (InDiKo) // Inklusion durch Digital Unterstützte Kommunikation (InDiKo)"
                                                     host-link="https://www.technikum-wien.at/" host-label="UAS Technikum Wien // FH Technikum Wien"
                                                     fund-link="https://www.wien.gv.at/kontakte/ma23/index.html" fund-label="City of Vienna // Stadt Wien"
                                                     timespan="2024-2028" additional-info="Project 38-09 // Projekt 38-09"/>
                        </ul>
                    </div>
                    <div>
                        <div class="d-block d-lg-flex justify-content-between align-items-center">
                            <div class="mt-3"><a href="https://www.technikum-wien.at/" target="_blank" title="UAS Technikum Wien"><img src="app/img/fhtw.svg" height="90"></a></div>
                            <div class="mt-3"><a href="https://www.wien.gv.at/kontakte/ma23/" target="_blank" :title="$t('ma23CityOfVienna')"><img src="app/img/ma23_logo_neu.jpg" height="90"></a></div>
                            <div class="mt-3"><a href="https://www.netidee.at/asterics-grid" target="_blank" title="netidee"><img src="app/img/netidee.svg" height="50"></a></div>
                        </div>

                        <i18n path="arasaacCollaboration" tag="div" class="mb-3 mt-5">
                            <template v-slot:arasaacLink>
                                <a href="https://arasaac.org/" target="_blank">{{ $t('aragoneseCenterOfAAC') }}</a>
                            </template>
                        </i18n>
                        <a href="https://arasaac.org/" title="ARASAAC" aria-hidden="true" target="_blank"><img src="app/img/arasaac.png" width="250px"></a>
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
                        <i18n path="privacyPolicyInfo" tag="span">
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
                    <h3>{{ $t('supportUs') }}</h3>
                    <span>{{ $t('ifYouWantToSupportTheDevelopmentOfAstericsGrid') }}</span>:
                    <div>
                        <a :title="$t('donateWithPaypal')" target="_blank" href="https://www.paypal.com/donate/?hosted_button_id=38AJJNS427MJ2" class="me-3">
                            <img class="mt-4" style="border:0px; max-width: 75vw" alt="" src="app/img/donate-paypal.png" width="250">
                        </a>
                        <a :title="$t('donateAtOpencollective')" target="_blank" href="https://opencollective.com/asterics-foundation/projects/asterics-grid">
                            <img class="mt-4" style="border:0px; max-width: 75vw" alt="" src="app/img/donate-open-collective.png" width="250">
                        </a>
                    </div>
                </div>
                <div class="srow">
                    <h3>{{ $t('acknowledgements') }}</h3>
                    <i18n path="thankBrowserstack" tag="div" class="mb-3">
                        <template v-slot:browserstackUrl>
                            <a target="_blank" href="https://www.browserstack.com//">browserstack.com</a>
                        </template>
                    </i18n>
                    <i18n path="thankResponsiveVoice" tag="div">
                        <template v-slot:responsiveVoiceUrl>
                            <a target="_blank" href="https://responsivevoice.org">ResponsiveVoice.org</a>
                        </template>
                    </i18n>
                    <div class="mb-3"><a href="https://responsivevoice.org">ResponsiveVoice-NonCommercial</a> {{ $t('licensedUnder') }} <a href="https://creativecommons.org/licenses/by-nc-nd/4.0/"><img title="ResponsiveVoice Text To Speech" src="app/img/responsive-voice-license.png" alt="95x15" width="95" height="15" /></a></div>
                    <div>
                        {{ $t('thanksToEduardoLleidaSolanoProfessorAtDepartment') }}
                    </div>
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
        <div class="bottom-spacer"></div>
    </div>
</template>

<script>
    import {Router} from "../../js/router";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import ProjectAcknowledgement from '../components/projectAcknowledgement.vue';

    export default {
        components: { ProjectAcknowledgement, HeaderIcon},
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
        margin-top: 1.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
</style>