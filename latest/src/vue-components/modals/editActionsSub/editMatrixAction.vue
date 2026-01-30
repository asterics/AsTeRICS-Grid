<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="actionType">{{ $t('actionType') }}</label>
            <div class="col-12 col-md-7">
                <select id="actionType" v-model="action.action" class="col-12" @change="actionTypeChanged">
                    <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                    <option v-for="action in GridActionMatrix.getActions()" :value="action">{{ $t(action) }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-if="action.action === GridActionMatrix.actions.MATRIX_SEND_CUSTOM">
            <label class="col-12 col-md-4 normal-text" for="sendText">{{ $t("textToSend") }}</label>
            <div class="col-12 col-md-7">
                <input class="col-12" id="sendText" v-model="action.sendText" spellcheck="false"
                       type="text" :placeholder="$t('textToSend')"/>
            </div>
        </div>
        <div class="row" v-if="action.action === GridActionMatrix.actions.MATRIX_SCROLL_UP || action.action === GridActionMatrix.actions.MATRIX_SCROLL_DOWN">
            <label class="col-12 col-md-4 normal-text" for="scrollPx">{{ $t("scrollPx") }}</label>
            <div class="col-12 col-md-7">
                <input class="col-12" id="scrollPx" v-model.number="action.scrollPx" type="number" min="1"/>
            </div>
        </div>
        <div class="row" v-if="action.action === GridActionMatrix.actions.MATRIX_SET_CONVERSATION">
            <label class="col-12 col-md-4 normal-text" for="changeToRoom">{{ $t("changeToMatrixRoom") }}</label>
            <div class="col-12 col-md-7">
                <select id="changeToRoom" v-model="action.selectRoomId" class="col-12">
                    <option :value="undefined" disabled selected hidden>{{ $t("pleaseSelect") }}</option>
                    <option v-for="room in matrixRooms" :value="room.roomId">{{ room.name }}</option>
                </select>
            </div>
        </div>
    </div>
</template>

<script>

import { GridActionMatrix } from '../../../js/model/GridActionMatrix';
import { matrixService } from '../../../js/service/matrixMessenger/matrixService';

export default {
    props: ['action'],
    data: function() {
        return {
            matrixRooms: [],
            GridActionMatrix: GridActionMatrix
        };
    },
    computed: {
    },
    methods: {
        actionTypeChanged() {
            if (this.action.action === GridActionMatrix.actions.MATRIX_SCROLL_UP || this.action.action === GridActionMatrix.actions.MATRIX_SCROLL_DOWN) {
                if (!this.action.scrollPx) {
                    this.action.scrollPx = 200;
                }
            } else {
                this.action.scrollPx = undefined;
            }
        }
    },
    async mounted() {
        this.matrixRooms = await matrixService.getRooms();
    }
}
</script>

<style scoped>
.normal-text {
    font-weight: normal;
}

.row {
    margin-bottom: 1em;
}
</style>