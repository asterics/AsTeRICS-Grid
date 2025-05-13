<template>
    <div>
        <ul class="mediaList">
            <li v-for="(mediaElem, index) in listElems">
                <div class="mediaListItem">
                    <img :src="mediaElem[imgProp]" alt=""/>
                    <div class="mediaElemLabel">{{mediaElem.radioName}}</div>
                    <div class="mediaElemButtons">
                        <button v-if="actionConfig.canMoveUp"
                                @click="elemUp(mediaElem)"
                                :disabled="index === 0">
                            <span class="hide-mobile">{{ $t('up') }}</span> <i class="fas fa-arrow-up"></i>
                        </button>
                        <button v-if="actionConfig.canPlay"
                                @click="emitTogglePlay(mediaElem)">
                            <span v-if="playingMedia !== mediaElem">
                                <span class="hide-mobile">{{ $t('play') }} </span><i class="fas fa-play"></i>
                            </span>
                            <span v-if="playingMedia === mediaElem">
                                <span class="hide-mobile">{{ $t('stop') }} </span><i class="fas fa-pause"></i>
                            </span>
                        </button>
                        <button v-if="actionConfig.canRemove"
                                @click="remove(mediaElem)">
                            <span class="hide-mobile">{{ $t('remove') }}</span> <i class="fas fa-trash"></i>
                        </button>
                        <button v-if="actionConfig.canSelect"
                                @click="addMediaElem(mediaElem)"
                                :disabled="value && Array.isArray(value) ? value.includes(mediaElem) : false">
                            <span class="hide-mobile">{{ $t('select') }}</span> <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </li>
        </ul>
        <div style="display: flex; margin-top: 0.5em" v-show="listElems.length > 0">
            <button @click="" disabled="" style="flex-grow: 1;"><i class="fas fa-arrow-left"></i> <span class="hide-mobile">{{ $t('previousPage') }}</span></button>
            <button @click="" disabled="" style="flex-grow: 1;"><span class="hide-mobile">{{ $t('nextPage') }}</span> <i class="fas fa-arrow-right"></i></button>
        </div>
    </div>
</template>

<script>
    export default {
        props: {
            gridData: Object,
            mediaElems: Array, // search result list
            actionConfigProp: Object,
            imgProp: String,
            value: Array, // selected list or editable list
            playingMedia: null
        },
        data() {
            return {
            }
        },
        computed: {
            actionConfig() {
                return Object.assign({
                    canSelect: true,
                    canPlay: true,
                    canMoveUp: false,
                    canRemove: false,
                }, this.actionConfigProp || {});
            },
            listElems() {
                return this.mediaElems || this.value || [];
            }
        },
        methods: {
            emitTogglePlay(mediaElem) {
                this.$emit('togglePlay', mediaElem);
            },
            emitChange(newValue) {
                this.$emit("input", newValue);
                this.$emit("change", newValue);
            },
            addMediaElem(mediaElem) {
                this.value = this.value || [];
                this.value.push(mediaElem);
                this.emitChange(this.value);
            },
            elemUp(mediaElem) {
                if (!this.value) {
                    return;
                }
                let index = this.value.indexOf(mediaElem);
                if (index > 0) {
                    this.value.splice(index - 1, 0, this.value.splice(index, 1)[0]);
                    this.emitChange(this.value);
                }
            },
            remove(mediaElem) {
                if (!this.value) {
                    return;
                }
                this.value = this.value.filter(elem => elem !== mediaElem);
                this.emitChange(this.value);
            }
        },
        mounted() {
        }
    }
</script>

<style scoped>
    ul li {
        list-style: none;
        outline: 1px solid lightgray;
        padding: 0.5em;
    }

    .mediaList button {
        line-height: unset;
        margin-bottom: 0;
        padding: 0 10px;
    }

    .mediaList, .mediaList li, .mediaList li div {
        padding: 0;
        margin: 0;
    }

    .mediaList li:hover {
        background-color: #c4f0fe;
    }

    .mediaListItem {
        display: flex;
    }

    .mediaListItem img {
        flex-grow: 0;
        flex-shrink: 0;
        vertical-align: middle;
        height: 28px;
        width: 28px;
    }

    .mediaElemLabel {
        flex-grow: 1;
        flex-shrink: 1;
        margin: 0 5px !important;
    }

    .mediaElemButtons {
        display: flex;
        flex-grow: 0;
        flex-shrink: 0;
    }
</style>