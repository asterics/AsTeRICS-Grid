<template>
    <modal :title="$t('unlockApplication')" :footer="false">
        <template #default>
            <div class="number-row" style="text-align: center; margin-bottom: 1em;">
                <span>{{ $t('inputPasscode') }}</span>
                <span class="hide-mobile">{{ $t('useButtonsOrKeyboard') }}</span><br/>
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
        </template>
    </modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import { modalMixin } from '../mixins/modalMixin.js';
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {inputEventHandler} from "../../js/input/inputEventHandler";

    export default {
        props: [],
        mixins: [modalMixin],
        data: function () {
            return {
                passcode: localStorageService.getAppSettings().unlockPasscode,
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