<template>
    <div class="mt-0">
        <div class="srow mt-0">
            <slider-input label="minimumPauseForCollectingAndSpeakingTheSameCellSev" id="minPauseSeCollectSpeak" min="0" max="10000" step="200" unit="s" decimals="1" display-factor="0.001" v-model.number="inputConfig.globalMinPauseCollectSpeak" @change="changed"/>
        </div>
        <div v-if="!hideAcousticFeedback">
            <component class="mb-3 mt-4" :is="headingTagInternal">{{ $t('acousticFeedbackOptions') }}</component>
            <div class="srow mt-0">
                <div class="twelve columns">
                    <input type="checkbox" id="chkReadActive" v-model="inputConfig.globalReadActive" @change="changed"/>
                    <label for="chkReadActive">{{ $t('readOutActiveElement') }}</label>
                </div>
            </div>
            <div class="srow my-2">
                <slider-input :label="$t('speedForReadingActiveElement')" id="readActiveRate" min="0.1" max="10" step="0.1" decimals="1" v-model.number="inputConfig.globalReadActiveRate" @change="changed"/>
            </div>
            <div class="srow my-2">
                <slider-input :label="$t('fastReadElementCount')" id="fastReadCount" min="1" max="10" step="1" decimals="0" v-model.number="inputConfig.globalReadActiveFastCount" @change="changed"/>
            </div>
            <div class="srow my-2">
                <slider-input :label="$t('fastReadSpeed')" id="fastReadRate" min="0.5" max="5" step="0.1" decimals="1" v-model.number="inputConfig.globalReadActiveFastRate" @change="changed"/>
            </div>
            <div class="srow">
                <div class="twelve columns">
                    <input type="checkbox" id="beepFeedback" v-model="inputConfig.globalBeepFeedback" @change="changed"/>
                    <label for="beepFeedback">{{ $t('enableAcousticFeedbackUsingBeepingSounds') }}</label>
                </div>
            </div>
            <div class="srow">
                <div class="twelve columns">
                    <input type="checkbox" id="readAdditional" v-model="inputConfig.globalReadAdditionalActions" @change="changed"/>
                    <label for="readAdditional">{{ $t('readElementActionsInAdditionToLabel') }}</label>
                </div>
            </div>
            <div class="srow">
                <div class="twelve columns">
                    <input type="checkbox" id="readCollectLetters" v-model="inputConfig.globalReadCollectLetters" @change="changed"/>
                    <label for="readCollectLetters">{{ $t('readCollectElementsLetterByLetter') }}</label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import SliderInput from "./sliderInput.vue";
    export default {
        components: {SliderInput},
        props: ['inputConfig', 'headingTag', "hideAcousticFeedback"],
        data() {
            return {
                headingTagInternal: 'h3'
            }
        },
        methods: {
            changed(event) {
                this.$emit('input', this.inputConfig);
                this.$emit('change', this.inputConfig);
            }
        },
        mounted() {
            if (this.headingTag) {
                this.headingTagInternal = this.headingTag;
            }
        },
        updated() {
        }
    }
</script>

<style scoped>
</style>