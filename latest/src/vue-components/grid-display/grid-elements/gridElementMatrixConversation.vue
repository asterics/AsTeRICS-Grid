<template>
    <div class="grid-item-content p-3">
        <matrix-conversation :grid-element="gridElement" v-bind="$attrs"/>
    </div>
</template>

<script>

import MatrixConversation from '../../components/matrix-conversation.vue';

export default {
    components: { MatrixConversation },
    props: ["gridElement"],
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
</style>