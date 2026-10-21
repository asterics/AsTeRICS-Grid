<template>
    <div class="container-fluid px-0">
        <div class="row">
            <div class="col-12">
                <input v-if="gridElement" id="autoSpeak" type="checkbox" v-model="gridElement.autoSpeak"/>
                <label for="autoSpeak">{{ $t('autoSpeakIncomingMessages') }}</label>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';

    export default {
        props: ['gridElement'],
        data: function () {
            return {
            }
        },
        methods: {
        },
        mounted() {
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>