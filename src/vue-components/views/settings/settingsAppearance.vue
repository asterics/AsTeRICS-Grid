<template>
    <div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('colors') }}</h3>
                <div class="srow">
                    <label class="three columns" for="elemColor">
                        <span>{{ $t('defaultGridElementColor') }}</span>
                    </label>
                    <input id="elemColor" v-model="metadata.colorConfig.elementBackgroundColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                    <button class="three columns" @click="metadata.colorConfig.elementBackgroundColor = constants.DEFAULT_ELEMENT_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                </div>
                <div class="srow">
                    <label class="three columns" for="appColor">
                        <span>{{ $t('defaultGridBackgroundColor') }}</span>
                    </label>
                    <input id="appColor" v-model="metadata.colorConfig.gridBackgroundColor" class="five columns" type="color" @change="saveMetadata(metadata)">
                    <button class="three columns" @click="metadata.colorConfig.gridBackgroundColor = constants.DEFAULT_GRID_BACKGROUND_COLOR; saveMetadata(metadata)">{{ $t('reset') }}</button>
                </div>
                <div class="srow">
                    <label class="three columns" for="colorScheme">
                        <span>{{ $t('colorSchemeForCategories') }}</span>
                    </label>
                    <select id="colorScheme" class="five columns" v-model="metadata.colorConfig.activeColorScheme" @change="saveMetadata(metadata)">
                        <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{scheme.name | translate}}</option>
                    </select>
                </div>
                <div class="srow">
                    <div class="five columns offset-by-three d-flex" style="height: 1.5em">
                        <div class="flex-grow-1" v-for="(color, index) in MetaData.getActiveColorScheme(metadata).colors" :title="$t(MetaData.getActiveColorScheme(metadata).categories[index])" :style="`background-color: ${color};`"></div>
                    </div>
                </div>
                <div class="srow">
                    <input id="colorSchemeActive" type="checkbox" v-model="metadata.colorConfig.colorSchemesActivated" @change="saveMetadata(metadata)"/>
                    <label for="colorSchemeActive">
                        <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                    </label>
                </div>
            </div>
        </div>
        <div class="srow">
            <div class="eleven columns">
                <h3 class="mt-2">{{ $t('elementLabels') }}</h3>
                <div class="srow">
                    <label class="three columns" for="convertText">{{ $t('convertElementLabels') }}</label>
                    <select id="convertText" v-model="metadata.textConfig.convertMode" class="five columns" @change="saveMetadata(metadata)">
                        <option :value="null">{{ $t('dontConvertLabels') }}</option>
                        <option :value="TextConfig.CONVERT_MODE_UPPERCASE">{{ $t('convertToUppercasse') }}</option>
                        <option :value="TextConfig.CONVERT_MODE_LOWERCASE">{{ $t('convertToLowercase') }}</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import { TextConfig } from '../../../js/model/TextConfig';
    import { MetaData } from '../../../js/model/MetaData';
    import { constants } from '../../../js/util/constants';
    import { settingsSaveMixin } from './settingsSaveMixin';

    export default {
        components: {},
        props: ["metadata", "userSettingsLocal"],
        mixins: [settingsSaveMixin],
        data() {
            return {
                TextConfig: TextConfig,
                MetaData: MetaData,
                constants: constants
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