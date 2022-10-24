<template>
    <div>
        <div class="srow mt-5">
            <h3>{{ $t('acousticFeedbackOptions') }}</h3>
        </div>
        <div class="srow mt-0">
            <div class="twelve columns">
                <input type="checkbox" id="chkReadActive" v-model="inputConfig.globalReadActive"/>
                <label for="chkReadActive">{{ $t('readOutActiveElement') }}</label>
            </div>
        </div>
        <div class="srow">
            <div class="twelve columns">
                <input type="number" id="readActiveRate" v-model.number="inputConfig.globalReadActiveRate" min="1" max="10" step="0.1"/>
                <label for="readActiveRate">{{ $t('speedForReadingActiveElement') }}</label>
            </div>
        </div>
        <div class="srow">
            <div class="twelve columns">
                <input type="checkbox" id="beepFeedback" v-model="inputConfig.globalBeepFeedback"/>
                <label for="beepFeedback">{{ $t('enableAcousticFeedbackUsingBeepingSounds') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props: ['inputConfig'],
        data() {
            return {
            }
        },
        methods: {
        },
        mounted() {
        },
        updated() {
        }
    }
</script>

<style scoped>
</style>