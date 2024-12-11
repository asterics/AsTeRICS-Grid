<template>
    <base-modal icon="fas fa-unlock" :title="$t('unlockApplication')" :help="false" :footer="false" @open="init" v-on="$listeners">
                        <div class="number-row">
                            <span>{{ $t('inputPasscode') }}</span>
                            <span class="hide-mobile">{{ $t('useButtonsOrKeyboard') }}</span><br/>
                            <span aria-hidden="true" style="font-size: 3em">
                                <span v-for="n in inputPasscode.length">&#9679;</span>
                                <span v-for="n in (Math.max(0, passcode ? passcode.length - inputPasscode.length: 1))">_</span>
                            </span>
                        </div>
                        <div class="keypad">
                            <button v-for="i in [1,2,3,4,5,6,7,8,9,0]" @click="inputDigit(i)">{{ i }}</button>
                        </div>
    </base-modal>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {modalMixin} from "../mixins/modalMixin";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {inputEventHandler} from "../../js/input/inputEventHandler";

    export default {
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
                    this.closeModal();
                } else if (!this.masterkeyPossible && this.inputPasscode.length >= this.passcode.length) {
                    this.closeModal();
                } else if (this.masterkeyPossible && this.inputPasscode.length === 10) {
                    this.$emit('unlock');
                    this.closeModal();
                }
            },
            resetTimeout() {
                clearTimeout(this.timeoutHandler);
                clearTimeout(this.timeoutMasterkeyHandler);
                this.timeoutHandler = setTimeout(() => {
                    this.closeModal();
                }, 5000);
                this.timeoutMasterkeyHandler = setTimeout(() => {
                    this.masterkeyPossible = false;
                }, 500);

            },
        init() {
            this.keyHandler?.destroy();
            this.inputPasscode = '';
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
        },
        beforeDestroy() {
            this.keyHandler?.destroy();
        }
    }
</script>

<style lang="scss" scoped>
    .number-row, .keypad {
        width: 60%;
        margin: 0 auto;
        margin-bottom: 1rem;
        text-align: center;
    }
    .keypad {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.4rem;
        justify-content: center;
        align-items: center;
        margin-bottom: 2rem;

        button {
            padding: 2vw 4vw;
            margin: 0;
            font-size: 4rem;
            font-weight: 400;
            cursor: pointer;

            &:last-child {
                grid-column: 2;
            }
        }
    }
</style>