<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('generalInputSettings') }}</h3>
                <global-input-options :input-config="metadata.inputConfig" heading-tag="h4" @change="saveMetadata(metadata)" :hide-acoustic-feedback="false"></global-input-options>
            </div>
        </div>
    </div>
</template>

<script>
    import { i18nService } from '../../../js/service/i18nService';
    import { util } from '../../../js/util/util';
    import { arasaacService } from '../../../js/service/pictograms/arasaacService';
    import GlobalInputOptions from '../../modals/input/globalInputOptions.vue';
    import { settingsSaveMixin } from './settingsSaveMixin';

    export default {
        components: { GlobalInputOptions },
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                i18nService: i18nService,
                util: util,
                arasaacService: arasaacService
            }
        },
        methods: {
        },
        async mounted() {
        }
    }
</script>

<style scoped>
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