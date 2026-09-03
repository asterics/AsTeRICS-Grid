<template>
    <div>
        <div class="srow">
            <h3 class="six columns">{{ $t('selectedPodcasts') }}</h3>
            <button class="six columns" :disabled="selectedPodcasts.length === 0" @click="addAllPodcastElements">{{ $t('createGridElementsForPodcasts') }}</button>
        </div>
        <media-list v-model="selectedPodcasts"
                    @input="$emit('input', selectedPodcasts)"
                    img-prop="image" id-prop="guid" title-prop="description"
                    :label-fn="podcast => `${podcast.title} (${podcast.author})`"
                    :action-config-prop="{canSelect: false, canMoveUp: true, canRemove: true}"
                    :playingMedia="playingPodcast"
                    @togglePlay="togglePlay"
                    :internal-pagination="true" :items-per-page="15">
        </media-list>
        <div v-if="selectedPodcasts.length === 0">{{ $t('noSelectedPodcastsUseSearchBar') }}</div>

        <div class="srow">
            <h3 class="four columns mb-0">{{ $t('podcastSearch') }}</h3>
            <span id="poweredby" class="eight columns">
                <i18n path="searchPoweredBy" tag="span">
                    <template v-slot:opensymbolsLink>
                        <a href="https://podcastindex.org/" target="_blank">podcastindex.org</a>
                    </template>
                </i18n>
            </span>
        </div>
        <div class="srow as">
            <search-bar v-model="searchTerm" @input="searchPodcasts" :debounce-time="500"></search-bar>
        </div>

        <div class="srow">
            <media-list :media-elems="searchResults"
                        v-model="selectedPodcasts"
                        @input="$emit('input', selectedPodcasts)"
                        img-prop="image" id-prop="guid" title-prop="description"
                        :label-fn="podcast => `${podcast.title} (${podcast.author})`"
                        @togglePlay="togglePlay"
                        :playingMedia="playingPodcast"
                        :internal-pagination="true">
            </media-list>
            <div v-show="searchResults.length === 0 && searchTerm && !isSearching && !searchError">{{ $t('noPodcastsFoundTryAnOtherSearchTerm') }}</div>
            <div v-show="searchError"><span>{{ $t('searchingFailedNoConnectionToInternet') }}</span> <a href="javascript:;" @click="searchPodcasts">{{ $t('retry') }}</a></div>
            <div v-show="isSearching">{{ $t('searching') }} <i class="fas fa-spinner fa-spin"></i></div>
        </div>
    </div>
</template>

<script>
    import MediaList from './media-list.vue';
    import SearchBar from './searchBar.vue';
    import { podcastService } from '../../js/service/podcastService';
    import { PodcastInfo } from '../../js/model/PodcastInfo';
    import { i18nService } from '../../js/service/i18nService';
    import { GridImage } from '../../js/model/GridImage';
    import { GridData } from '../../js/model/GridData';
    import { GridActionPodcast } from '../../js/model/GridActionPodcast';

    export default {
        components: { SearchBar, MediaList },
        props: {
            value: Array,
            gridData: Object
        },
        data() {
            return {
                PAGINATION_LIMIT: 10,
                selectedPodcasts: this.value,
                searchResults: [],
                searchTerm: null,
                isSearching: false,
                searchError: false,
                playingPodcast: null
            }
        },
        methods: {
            async togglePlay(podcastInfo) {
                let playingPodcastGuid = await podcastService.toggle(podcastInfo.guid);
                this.playingPodcast = new PodcastInfo({ guid: playingPodcastGuid });
            },
            searchPodcasts() {
                this.isSearching = true;
                this.searchError = false;
                podcastService.search(this.searchTerm).then(result => {
                    this.searchResults = result;
                    this.isSearching = false;
                }).catch(() => {
                    this.searchError = true;
                    this.isSearching = false;
                });
            },
            addAllPodcastElements() {
                if (!confirm(i18nService.t('thisActionAddsXNewElements', this.selectedPodcasts.length))) {
                    return;
                }
                for (let podcast of this.selectedPodcasts) {
                    let image = new GridImage({
                        url: podcast.image,
                        author: podcast.author,
                        authorURL: podcast.link
                    });
                    let newElement = new GridData(this.gridData).getNewGridElement({
                        label: i18nService.getTranslationObject(podcast.title),
                        actions: [new GridActionPodcast({
                            podcastGuid: podcast.guid,
                            action: GridActionPodcast.actions.TOGGLE
                        })],
                        image: image
                    });
                    this.gridData.gridElements.push(JSON.parse(JSON.stringify(newElement)));
                }
            },
        },
        mounted() {
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    @media (min-width: 850px) {
        #poweredby {
            margin-top: 1em;
        }
    }
</style>