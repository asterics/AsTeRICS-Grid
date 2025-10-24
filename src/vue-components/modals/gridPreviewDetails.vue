<template>
    <div>
        <div v-if="preview.images.length > 1" aria-hidden="true" class="mb-5" style="overflow-x: auto">
            <ul class="d-flex mb-0">
                <li v-for="url of preview.images" class="me-3 mb-0">
                    <img :src="url" @click="selectedImage = url" width="200" style="cursor: pointer"/>
                </li>
            </ul>
        </div>
        <div class="container-fluid p-0">
            <div class="row" aria-hidden="true">
                <div class="col-12 col-md-7" v-if="selectedImage || preview.images.length === 0 && preview.thumbnail">
                    <img v-if="selectedImage" :src="selectedImage" class="col-12"/>
                    <img v-if="!selectedImage && preview.thumbnail" :src="preview.thumbnail" class="col-12"/>
                </div>
                <div class="col-12 col-md-5">
                    <div class="mb-3" v-if="preview.author">
                        <strong>{{ $t('author') }}</strong>:
                        <span v-if="!preview.website">{{preview.author}}</span>
                        <a v-if="preview.website" :href="preview.website" target="_blank">{{preview.author}}</a>
                    </div>
                    <div class="mb-3" v-if="preview.description"><strong>{{ $t('description') }}</strong>: <span v-html="i18nService.getTranslation(preview.description)"></span></div>
                    <div class="mb-3"><strong>{{ $t('searchProvider') }}</strong>: <a :href="preview.providerUrl" target="_blank">{{preview.providerName}}</a></div>
                    <div v-if="preview.languages.length === 1"><strong>{{ $t('language') }}</strong>: {{ $t('lang.' + preview.languages[0]) }}</div>
                    <div v-if="preview.languages.length > 1"><strong>{{ $t('languages') }}</strong>: {{ preview.languages.reduce((total, current, index, array) => {
                        let separator = index < array.length - 1 ? ', ' : '';
                        return total + $t('lang.' + current) + separator;
                    }, '') }}
                    </div>
                    <div class="mt-3" v-if="preview.tags.length > 0">
                        <strong>{{ $t('tags') }}</strong>:
                        <span class="tag" style="background-color: lightgray" v-for="tag in preview.tags">{{ tag }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import './../../css/modal.css';
    import { i18nService } from '../../js/service/i18nService';

    export default {
        props: ['preview'],
        data: function () {
            return {
                selectedImage: this.preview.images[0],
                i18nService: i18nService
            }
        },
        methods: {
        },
        mounted() {
        }
    }
</script>

<style scoped>
ul {
    list-style-type: none;
}

.tag {
    flex-shrink: 1;
    margin: 0.3em 0.3em 0.3em 0;
    border-radius: 5px;
    padding: 0px 3px 0px 3px;
}
</style>