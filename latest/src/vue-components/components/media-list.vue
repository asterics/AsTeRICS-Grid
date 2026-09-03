<template>
    <div>
        <ul class="mediaList">
            <li v-for="(mediaElem, index) in paginatedElems" :title="titleProp ? mediaElem[titleProp] : ''">
                <div class="mediaListItem">
                    <img :src="mediaElem[imgProp]" :key="mediaElem[imgProp]" alt=""/>
                    <div class="mediaElemLabel">{{ labelFn ? labelFn(mediaElem) : '' }}</div>
                    <div class="mediaElemButtons">
                        <button v-if="actionConfig.canMoveUp"
                                @click="elemUp(mediaElem)"
                                :disabled="isFirstElem(mediaElem)">
                            <span class="hide-mobile">{{ $t('up') }}</span> <i class="fas fa-arrow-up"></i>
                        </button>
                        <button v-if="actionConfig.canPlay"
                                @click="emitTogglePlay(mediaElem)">
                            <span v-if="!elemsEqual(playingMedia, mediaElem)">
                                <span class="hide-mobile">{{ $t('play') }} </span><i class="fas fa-play"></i>
                            </span>
                            <span v-if="elemsEqual(playingMedia, mediaElem)">
                                <span class="hide-mobile">{{ $t('stop') }} </span><i class="fas fa-pause"></i>
                            </span>
                        </button>
                        <button v-if="actionConfig.canRemove"
                                @click="remove(mediaElem)">
                            <span class="hide-mobile">{{ $t('remove') }}</span> <i class="fas fa-trash"></i>
                        </button>
                        <button v-if="actionConfig.canSelect"
                                @click="addMediaElem(mediaElem)"
                                :disabled="value && Array.isArray(value) ? !!value.find(elem => elemsEqual(elem, mediaElem)) : false">
                            <span class="hide-mobile">{{ $t('select') }}</span> <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </li>
        </ul>
        <div style="display: flex; margin-top: 1em" v-if="!disableNext || !disablePrev">
            <button @click="prev" :disabled="disablePrev" style="flex-grow: 1;"><i class="fas fa-arrow-left"></i> <span class="hide-mobile">{{ $t('previousPage') }}</span></button>
            <button @click="next" :disabled="disableNext" style="flex-grow: 1;"><span class="hide-mobile">{{ $t('nextPage') }}</span> <i class="fas fa-arrow-right"></i></button>
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
            titleProp: String,
            labelFn: Function,
            idProp: {
                type: String,
                default: "id"
            },
            value: Array, // selected list or editable list
            playingMedia: Object,
            enableNext: Boolean,
            enablePrev: Boolean,
            internalPagination: Boolean,
            itemsPerPage: {
                type: Number,
                default: 10
            }
        },
        data() {
            return {
                paginationPage: 1
            }
        },
        computed: {
            actionConfig() {
                return Object.assign({
                    canSelect: true,
                    canPlay: true,
                    canMoveUp: false,
                    canRemove: false
                }, this.actionConfigProp || {});
            },
            listElems() {
                return this.mediaElems || this.value || [];
            },
            paginatedElems() {
                let elems = this.listElems;
                if (!this.internalPagination) {
                    return elems;
                } else {
                    const start = (this.paginationPage - 1) * this.itemsPerPage;
                    const end = start + this.itemsPerPage;
                    return elems.slice(start, end);
                }
            },
            disableNext() {
                if (this.listElems.length === 0) {
                    return true;
                }
                if (this.internalPagination) {
                    let lastElem = this.listElems[this.listElems.length - 1];
                    return this.paginatedElems.includes(lastElem);
                } else {
                    return !this.enableNext;
                }
            },
            disablePrev() {
                if (this.listElems.length === 0) {
                    return true;
                }
                if (this.internalPagination) {
                    return this.paginationPage === 1;
                } else {
                    return !this.enablePrev;
                }
            }
        },
        methods: {
            isFirstElem(elem) {
                let first = this.listElems[0] || {};
                return this.elemsEqual(elem, first);
            },
            elemsEqual(elem1, elem2) {
                if (!elem1 || !elem2) {
                    return false;
                }
                return this.idProp ? elem1[this.idProp] === elem2[this.idProp] : elem1 === elem2;
            },
            emitTogglePlay(mediaElem) {
                this.$emit('togglePlay', mediaElem);
            },
            prev() {
                if (this.internalPagination) {
                    this.paginationPage = this.disablePrev ? this.paginationPage : this.paginationPage - 1;
                } else {
                    this.$emit('paginatePrev');
                }
            },
            next() {
                if (this.internalPagination) {
                    this.paginationPage = this.disableNext ? this.paginationPage : this.paginationPage + 1;
                } else {
                    this.$emit('paginateNext');
                }
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
                let newElems = this.value.filter(elem => !this.elemsEqual(elem, mediaElem));
                this.emitChange(newElems);
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