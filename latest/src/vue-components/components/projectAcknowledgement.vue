<template>
    <li>
        <strong>{{ timespan }}:</strong>
        <span><a :href="nameLink" target="_blank">{{ getLabel(nameLabel) }}</a>, </span>
        <span v-if="hostLabel"><a :href="hostLink" target="_blank">{{ getLabel(hostLabel) }}</a>, </span>
        <span>{{ $t("fundedBy") }}</span>
        <span v-if="fundLabel"><a :href="fundLink" target="_blank">{{ getLabel(fundLabel) }}</a></span><span v-if="additionalInfo">, {{ getLabel(additionalInfo) }}</span>
    </li>
</template>

<script>
import { i18nService } from '../../js/service/i18nService';

export default {
    props: ["timespan", "nameLink", "nameLabel", "hostLink", "hostLabel", "fundLink", "fundLabel", "additionalInfo"],
    data() {
        return {}
    },
    methods: {
        getLabel(string = "") {
            if (!string.includes(' // ')) {
                return string;
            }
            let parts = string.split(" // ");
            return i18nService.isCurrentAppLangDE() ? parts[1] : parts[0];
        }
    },
    mounted() {
    }
}
</script>

<style scoped>
</style>