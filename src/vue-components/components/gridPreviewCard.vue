<template>
    <li class="card-container" :style="'justify-content:' + (preview ? 'space-between' : 'center')">
        <div class="preview-content" v-if="preview">
            <strong class="d-block mb-3">{{ preview.name | extractTranslation }}</strong>
            <img aria-hidden="true" v-if="preview.thumbnail" :src="preview.thumbnail" style="width: 100%; aspect-ratio: 16/9;"/>
            <div v-if="!preview.thumbnail" class="img-placeholder mb-3" style="aspect-ratio: 16/9; width: 99%; border: 1px solid lightgray"></div>
            <div class="d-flex col-12" style="flex-wrap: wrap">
                <span class="tag" v-if="preview.languages.length === 1" style="background-color: lightgreen">{{ $t(`lang.${preview.languages[0]}`) }}</span>
                <span class="tag" v-if="preview.languages.length > 1" style="background-color: lightgreen">{{ "multi-lang" }}</span>
                <span class="tag" style="background-color: lightgray" v-for="tag in preview.tags">{{ tag }}</span>
            </div>
        </div>
        <div v-if="preview && hideButtons !== true" class="preview-buttons d-flex justify-content-between">
            <button v-if="detailButtonCallback" @click="detailButtonCallback(preview)"><span class="fa fa-info-circle"/> {{ $t('details') }}</button>
            <button :class="(detailButtonCallback ? ' btn-primary' : 'flex-grow-1')" @click="useButtonCallback(preview)"><span class="fa fa-check"/> {{ this.useButtonLabel ? $t(this.useButtonLabel) : $t('useIt') }}</button>
        </div>
        <div class="more-container" v-if="!preview && moreButtonCallback">
            <button @click="moreButtonCallback"><i class="fas fa-plus-circle"/> {{ $t('loadMoreResults') }}</button>
        </div>
    </li>
</template>

<script>
export default {
    props: ["preview", "hideButtons", "detailButtonCallback", "useButtonCallback", "useButtonLabel", "moreButtonCallback"],
    data() {
        return {
        }
    },
    methods: {
    },
    mounted() {
    },
}
</script>

<style scoped>
.card-container {
    box-shadow: 1px 1px 3px lightgray;
    border-radius: 5px;
    padding: 10px;
    border: 1px solid lightgray;
    display: flex;
    flex-direction: column;
}

.preview-content {
    max-height: 85%;
}

.preview-buttons {
    margin-top: 1em;
    bottom: 0.5em;
}

.preview-buttons button {
    width: 49%;
}

.more-container {
    display: flex;
    aspect-ratio: 16 / 9;
    width: 99%;
    align-items: center;
    justify-content: center;
}

.tag {
    flex-shrink: 1;
    margin: 0.3em 0.3em 0.3em 0;
    border-radius: 5px;
    padding: 0px 3px 0px 3px;
}
</style>