<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="podcastAction">{{ $t(GridActionPodcast.getModelName()) }}</label>
            <div class="col-12 col-md-7">
                <select id="podcastAction" v-model="action.action" class="col-12">
                    <option v-for="action in GridActionPodcast.actions" :value="action">{{ $t(action) }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-show="GridActionPodcast.actionsWithPodcastSelect.includes(action.action)">
            <label class="col-12 col-md-4 normal-text" for="podcastToPlay">{{ $t("podcastToPlay") }}</label>
            <div class="col-12 col-md-7">
                <select id="podcastToPlay" v-model="action.podcastGuid" class="col-12">
                    <option :value="undefined">{{ $t('automaticLastPlayed') }}</option>
                    <option v-for="podcast in podcasts" :value="podcast.guid">{{ podcast.title }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-show="GridActionPodcast.actionsWithStepSeconds.includes(action.action)">
            <label class="col-12 col-md-4 normal-text" for="stepSeconds">{{ `${$t(action.action)} ${$t("secondsBracket")}` }}</label>
            <div class="col-12 col-md-7">
                <input class="col-12" id="stepSeconds" type="number" v-model.number="action.stepSeconds">
            </div>
        </div>
    </div>
</template>

<script>

import { GridActionPodcast } from '../../../js/model/GridActionPodcast';
import { dataService } from '../../../js/service/data/dataService';

export default {
    props: ['action'],
    data: function () {
        return {
            GridActionPodcast: GridActionPodcast,
            metadata: null
        }
    },
    computed: {
        podcasts() {
            if(!this.metadata) {
                return [];
            }
            return this.metadata.integrations.podcasts;
        }
    },
    methods: {
    },
    async mounted() {
        this.metadata = await dataService.getMetadata();
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