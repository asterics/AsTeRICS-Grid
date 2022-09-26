<template>
    <div>
        <header-icon full-header="true"></header-icon>
        <div class="container ms-0">
            <div class="row ps-2 ps-sm-3 ps-md-4 col-12 col-md-10 col-xl-8 mt-0">
                <h1>{{ $t('browserIncompatible') }}</h1>
                <div>
                    <span>{{ $t('yourBrowserCantRunAstericsGridPleaseUseOneOfThese') }}</span>:
                </div>
                <ul>
                    <li><a href="https://www.google.com/intl/en_us/chrome/" target="_blank">Google Chrome</a></li>
                    <li><a href="https://www.mozilla.org/en-US/firefox/browsers/" target="_blank">Mozilla Firefox</a></li>
                    <li><a href="https://www.apple.com/safari/" target="_blank">Apple Safari</a></li>
                    <li><a href="https://www.microsoft.com/edge" target="_blank">Microsoft Edge</a></li>
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