<template>
    <div>
        <accordion :acc-label="$t('HEADER_COMPARE_ONLINE_OFFLINE')" class="six columns offset-by-two">
            <div>
                <h3>{{ $t('offlineUser') }}</h3>
                <ul class="fa-ul">
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allGridsAreSavedOffline') }}</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allFunctionsAvailable') }}</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('idealForUsingOnASingleDevice') }}</span></li>
                </ul>
            </div>
            <div>
                <h3>{{ $t('onlineUser') }}</h3>
                <ul class="fa-ul">
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allGridsAreSavedOfflineAndOnline') }}</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('automaticSynchronizationAcrossMultipleDevices') }}</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('allDataIsEndtoendEncryptedAndOnlyYouAreAble') }}</span></li>
                    <li><span class="fa-li"><i class="fas fa-check"></i></span><span>{{ $t('forRegistrationOnlyAUsernameAndAPasswordIsNeeded') }}</span></li>
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