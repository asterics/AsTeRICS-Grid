<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header" data-i18n>
                            Unlock application // Anwendung entsperren
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="number-row" style="text-align: center; margin-bottom: 1em;">
                            <span data-i18n="">Input passcode // PIN eingeben</span>
                            <span class="hide-mobile" data-i18n="">(use buttons or keyboard) // (verwenden Sie Buttons oder Tastatur)</span><br/>
                            <span aria-hidden="true" style="font-size: 3em">
                                <span v-for="n in inputPasscode.length">&#9679;</span>
                                <span v-for="n in (Math.max(0, passcode.length - inputPasscode.length))">_</span>
                            </span>
                        </div>
                        <div class="number-row">
                            <button v-for="i in [1,2,3]" @click="inputDigit(i)">{{i}}</button>
                        </div>
                        <div class="number-row">
                            <button v-for="i in [4,5,6]" @click="inputDigit(i)">{{i}}</button>
                        </div>
                        <div class="number-row">
                            <button v-for="i in [7,8,9]" @click="inputDigit(i)">{{i}}</button>
                        </div>
                        <div class="number-row">
                            <button style="margin-left: 33%" @click="inputDigit(0)">0</button>
                        </div>
                    </div>
                    <div class="modal-footer">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {inputEventHandler} from "../../js/input/inputEventHandler";

    export default {
        props: [],
        data: function () {
            return {
                passcode: localStorageService.getUnlockPasscode(),
                inputPasscode: '',
                timeoutHandler: null,
                masterkeyPossible: true,
                timeoutMasterkeyHandler: null,
                keyHandler: null,
            }
        },
        methods: {
            inputDigit(digit) {
                this.resetTimeout();
                this.inputPasscode = this.inputPasscode + digit;
                if (this.inputPasscode === this.passcode) {
                    this.$emit('unlock');
                    this.$emit('close');
                } else if (!this.masterkeyPossible && this.inputPasscode.length >= this.passcode.length) {
                    this.$emit('close');
                } else if (this.masterkeyPossible && this.inputPasscode.length === 10) {
                    this.$emit('unlock');
                    this.$emit('close');
                }
            },
            resetTimeout() {
                clearTimeout(this.timeoutHandler);
                clearTimeout(this.timeoutMasterkeyHandler);
                this.timeoutHandler = setTimeout(() => {
                    this.$emit('close');
                }, 5000);
                this.timeoutMasterkeyHandler = setTimeout(() => {
                    this.masterkeyPossible = false;
                }, 500);
            }
        },
        mounted() {
            this.keyHandler = inputEventHandler.instance();
            this.keyHandler.onAnyKey((keycode) => {
                let digit = keycode - 48;
                if (digit >= 0 && digit <= 9) {
                    this.inputDigit(digit);
                }
            });
            this.keyHandler.startListening();
            i18nService.initDomI18n();
            this.resetTimeout();
        },
        beforeDestroy() {
            this.keyHandler.destroy();
        }
    }
</script>

<style scoped>
    .number-row {
        width: 60%;
        margin: 0 auto;
    }
    .modal-body button {
        width: 30%;
        padding: 3% 0;
        margin-right: 3%;
        font-size: 2.5em;
    }
</style>