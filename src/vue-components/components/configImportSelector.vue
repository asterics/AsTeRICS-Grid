<template>
    <div class="container-fluid g-0 mb-5">
        <div class="row" v-if="defaultGridsets">
            <label for="selectGridset" class="col-md-3">{{ $t('selectConfiguration') }}</label>
            <select v-model="selectedGridset" id="selectGridset" class="col-md-8">
                <option v-for="set in defaultGridsets" :value="set">{{ set.name + ` (${(set.languages.length > 1 ? $t('multilingual') : $t(`lang.${set.languages[0]}`))})`}}</option>
            </select>
        </div>
        <div class="row" v-if="selectedGridset">
            <strong>{{selectedGridset.name}}</strong>
            <div class="col-11 mt-2">
                <strong>Author</strong>:
                <span v-if="!selectedGridset.website">{{selectedGridset.author}}</span>
                <a v-if="selectedGridset.website" :href="selectedGridset.website" target="_blank">{{selectedGridset.author}}</a>
            </div>
            <div class="col-11" v-if="selectedGridset.languages.length == 1"><strong>{{ $t('language') }}</strong>: {{ $t('lang.' + selectedGridset.languages[0]) }}</div>
            <div class="col-11" v-if="selectedGridset.languages.length > 1"><strong>{{ $t('languages') }}</strong>: {{ selectedGridset.languages.reduce((total, current, index, array) => {
                let separator = index < array.length - 1 ? ', ' : '';
                return total + $t('lang.' + current) + separator;
            }, '') }}
            </div>
            <div class="col-11" v-if="selectedGridset.description"><strong>{{ $t('description') }}</strong>: {{ selectedGridset.description | extractTranslation }}</div>
        </div>
        <div class="row" style="margin-top: 3em">
            <button class="col-12 col-md-4 offset-md-7" @click="importData"><span v-if="!loading" class="fas fa-check"/><span v-if="loading" class="fas fa-spinner fa-spin"/> <span>{{ $t('importData') }}</span></button>
        </div>
    </div>
</template>

<script>
    import $ from '../../js/externals/jquery.js';
    import {i18nService} from "../../js/service/i18nService.js";
    import {dataService} from "../../js/service/data/dataService.js";
    import {Router} from "../../js/router.js";

    export default {
        props: [],
        data() {
            return {
                defaultGridsets: null,
                selectedGridset: null,
                loading: false
            }
        },
        methods: {
            importData() {
                if (!this.selectedGridset) {
                    return;
                }
                this.loading = true;
                $.get(this.getGridsetUrl()).then(result => {
                    dataService.importData(result, {}).then(() => {
                        this.loading = false;
                        Router.toMain();
                    });
                });
            },
            getGridsetUrl() {
                return `app/gridsets/${this.selectedGridset.filename}`;
            }
        },
        mounted() {
            let thiz = this;
            $.get('app/gridsets/gridset_metadata.json').then(result => {
                let currentLang = i18nService.getContentLang();
                result.sort((a, b) => {
                    if (a.standardFor && a.standardFor.includes(currentLang)) return -1;
                    if (b.standardFor && b.standardFor.includes(currentLang)) return 1;
                    let aLang = a.languages.includes(currentLang);
                    let bLang = b.languages.includes(currentLang);
                    if (aLang && !bLang) return -1;
                    if (bLang && !aLang) return 1;
                    return a.name.localeCompare(b.name);
                });
                thiz.selectedGridset = result[0];
                thiz.defaultGridsets = result;
                navigator.serviceWorker.ready.then(() => {
                    navigator.serviceWorker.controller.postMessage({
                        urlToAdd: thiz.getGridsetUrl()
                    });
                });
            })
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-top: 1.5em;
}
</style>