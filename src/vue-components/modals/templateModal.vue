<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('setGridSize') }}
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label for="gridRows">{{ $t('numberOfRows') }}</label>
                            <input id="gridRows" type="number"/>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('insertWords') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';

    export default {
        props: ['dictData'],
        data: function () {
            return {
                inputText: "",
            }
        },
        methods: {
            save() {
                thiz.$emit('reload');
                thiz.$emit('close');
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>