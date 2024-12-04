<template>
            <div v-if="gridElement" class="element">
                <div v-if="gridElement.type === GridElement.ELEMENT_TYPE_NORMAL" :class="{ normal: Object.keys(gridElement.label).length > 0 }">
                    <img v-if="gridElement.image && (gridElement.image.data || gridElement.image.url)" :src="gridElement.image.data || gridElement.image.url"/>
                    <span tab-index="0">{{ gridElement.label | extractTranslation }}</span>
                </div>
                <div v-if="gridElement.type !== GridElement.ELEMENT_TYPE_NORMAL">
                    <span>{{ gridElement.type | translate }}</span>
                </div>
            </div>
</template>

<script>
    import {GridElement} from "../../js/model/GridElement.js";

    export default {
        props: ["gridElement"],
        data() {
            return {
                GridElement: GridElement
            }
        }
    }
</script>

<style lang="scss" scoped>
.element {
    flex-grow: 6;
    display: flex;
    
    & > .normal {
        flex-flow: column nowrap;
        align-items: center;
        justify-content: flex-start;
        background-color: white;
        border: 1px solid lightgray;
        box-shadow: 0 0 0.5rem lightgray;
    }
    
    & > div {
        display: flex;
        padding: 0.5rem 1rem;
        
        img {
            height: 4rem;
        }

        img {
            border: 1px solid #111;
            width: 4rem;
            object-fit: contain;
        }
        
        span {
            padding: 0 1rem;
            font-size: 1.5rem;
            text-align: center;
        }
    }
}

@media screen and (min-width: 768px) {
    .element {
        & > .normal {
            flex-flow: row nowrap;
        }
        & > div {
            span {
                line-height: 4rem;
                height: 4rem;
            }
        }
    }
}
</style>