<template>
    <div class="container-fluid px-0">
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="inputRestUri">HTTP URL</label>
            <div class="col-12 col-md-7">
                <input class="col-12" id="inputRestUri" v-model="action.restUrl" spellcheck="false" autocomplete="true"
                       type="text" placeholder="http(s)://<hostname>:<port>/<path to rest function>"/>
            </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="body">{{ $t('httpBodyData') }}</label>
            <div class="col-12 col-md-7">
                <textarea id="body" v-model="action.body" class="col-12" rows="1"
                       placeholder="ON | OFF | {&quot;data&quot;: 123} | ..." spellcheck="false" type="text"/>
            </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="method">{{ $t('httpMethod') }}</label>
            <div class="col-12 col-md-7">
                <select id="method" v-model="action.method" class="col-12">
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="HEAD">HEAD</option>
                    <option value="OPTIONS">OPTIONS</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="content-type">HTTP Content-Type</label>
            <div class="col-12 col-md-7">
                <input id="content-type" v-model="action.contentType" class="col-12"
                       placeholder="text/plain | application/json | ..." spellcheck="false" autocomplete="true" type="text"/>
            </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="auth-user">{{ $t('httpAuthUser') }}</label>
            <div class="col-12 col-md-7">
                <input id="auth-user" v-model="action.authUser" class="col-12" autocomplete="true" type="text" :placeholder="$t('optionalBracket')"/>
            </div>
        </div>
        <div class="row">
            <label class="col-12 col-md-4 normal-text" for="auth-pw">{{ $t('httpAuthPw') }}</label>
            <div class="col-12 col-md-7">
                <input id="auth-pw" v-model="action.authPw" class="col-12" type="password" :placeholder="$t('optionalBracket')"/>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    props: ['action', 'gridData'],
    computed: {
    },
    methods: {
    },
    mounted() {
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