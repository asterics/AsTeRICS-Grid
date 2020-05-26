<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Set grid size // Grid-Größe anpassen
                        </h1>
                    </div>

                    <div class="modal-body container">
                        <div class="row">
                            <label for="gridRows" data-i18n="">Number of rows // Anzahl der Zeilen</label>
                            <input id="gridRows" type="number"/>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container">
                            <button @click="$emit('close')" title="Keyboard: [Esc]">
                                <i class="fas fa-times"/> <span data-i18n>Cancel // Abbrechen</span>
                            </button>
                            <button @click="save()" title="Keyboard: [Ctrl + Enter]">
                                <i class="fas fa-check"/> <span data-i18n>Insert words // Wörter einfügen</span>
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
            i18nService.initDomI18n();
        }
    }
</script>

<style scoped>
    .row {
        margin-top: 1em;
    }
</style>