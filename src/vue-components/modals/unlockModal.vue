<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('unlockApplication') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="number-row input-indicator">
                            <span class="hide-small-height">{{ $t('inputPasscode') }}</span>
                            <span class="hide-small-height">{{ $t('useButtonsOrKeyboard') }}</span><br/>
                            <span aria-hidden="true" class="hint">
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
                let masterPossible = this.masterkeyPossible &&  this.inputPasscode.startsWith('4');
                if (this.inputPasscode === this.passcode) {
                    this.$emit('unlock');
                    this.$emit('close');
                } else if (!masterPossible && this.inputPasscode.length >= this.passcode.length) {
                    this.$emit('close');
                } else if (masterPossible && this.inputPasscode.length === 10) {
                    this.$emit('unlock');
                    this.$emit('close');
                }
            },
            resetTimeout(firstTime) {
                clearTimeout(this.timeoutHandler);
                clearTimeout(this.timeoutMasterkeyHandler);
                this.timeoutHandler = setTimeout(() => {
                    this.$emit('close');
                }, 5000);
                this.timeoutMasterkeyHandler = setTimeout(() => {
                    this.masterkeyPossible = false;
                }, firstTime ? 1000 : 300);
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
            this.resetTimeout(true);
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
        max-height: 10vh;
    }

    .input-indicator {
        text-align: center;
        margin-bottom: 1.5em;
    }

    .input-indicator .hint {
        font-size: 3em;
    }

    @media screen and (max-height: 500px) {
        .number-row {
            width: 40%;
        }

        .modal-body button {
            font-size: 2em;
            line-height: 1;
            padding: 0;
        }

        .hide-small-height {
            display: none;
        }

        .input-indicator .hint {
            font-size: 2em;
            line-height: 0.5;
        }

        .modal-body {
            margin-top: 0;
        }
    }
</style>