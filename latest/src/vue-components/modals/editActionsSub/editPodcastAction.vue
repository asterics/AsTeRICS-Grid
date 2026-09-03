<template>
    <div class="container-fluid px-0" v-if="metadata">
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
                    <option v-for="podcast in metadata.integrations.podcasts" :value="podcast.guid">{{ podcast.title }}</option>
                </select>
            </div>
        </div>
        <div class="row" v-show="GridActionPodcast.actionsWithStepSeconds.includes(action.action)">
            <label class="col-12 col-md-4 normal-text" for="stepSeconds">{{ `${$t(action.action)} ${$t("secondsBracket")}` }}</label>
            <div class="col-12 col-md-7">
                <input class="col-12" id="stepSeconds" type="number" v-model.number="action.stepSeconds">
            </div>
        </div>
        <div class="row">
            <accordion :acc-label="$t('managePodcasts')" :acc-open="metadata.integrations.podcasts.length === 0" class="col-12">
                <podcast-list-selector @input="selectedPodcastsChanged()" v-model="metadata.integrations.podcasts" :grid-data="gridData"></podcast-list-selector>
            </accordion>
        </div>
    </div>
</template>

<script>

import { GridActionPodcast } from '../../../js/model/GridActionPodcast';
import { dataService } from '../../../js/service/data/dataService';
import PodcastListSelector from '../../components/podcastListSelector.vue';
import Accordion from '../../components/accordion.vue';

export default {
    components: { Accordion, PodcastListSelector },
    props: ['action', 'gridData'],
    data: function () {
        return {
            GridActionPodcast: GridActionPodcast,
            metadata: null
        }
    },
    methods: {
        selectedPodcastsChanged() {
            this.$forceUpdate();
            dataService.saveMetadata(this.metadata);
        }
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