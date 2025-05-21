<template>
    <div class="container-fluid px-0" v-if="metadata">
        <div v-if="loggedInUser">
            <div class="mb-3">
                <i18n path="LoggedInAsSentence" tag="span">
                    <template v-slot:user>"<strong>{{loggedInUser}}</strong>"</template>
                </i18n>
            </div>
            <div v-if="e2eeSupported">
                <i class="fas fa-lock"></i>
                <span>{{ $t('matrixE2eeSupported') }}.</span>
            </div>
            <div v-if="!e2eeSupported">
                <i class="fas fa-lock-open"></i>
                <span>{{ $t('matrixE2eeNotSupported') }}.</span>
            </div>
            <div class="mt-4">
                <button @click="logout">
                    <i v-if="logoutLoading" class="fas fa-spinner fa-spin"></i>
                    <i v-if="!logoutLoading" class="fas fa-sign-out-alt"></i>
                    <span>{{ $t('logout') }}</span>
                </button>
            </div>
        </div>
        <div v-if="!loggedInUser">
            <div class="row mb-5">
                <div class="col">
                    <i class="fas fa-info-circle me-2"></i>
                    <i18n path="ifNoUserCreateMatrixAccount" tag="span">
                        <template v-slot:link><a href="https://app.element.io/#/register" target="_blank">app.element.io</a></template>
                    </i18n>
                </div>
            </div>
            <div class="row">
                <label class="col-sm-3" for="matrixUser">{{ $t('username') }}</label>
                <div class="col-sm-7">
                    <input type="text" class="col-12" id="matrixUser" v-model="syncConfig.user"/>
                </div>
            </div>
            <div class="row">
                <label class="col-sm-3" for="matrixPassword">{{ $t('password') }}</label>
                <div class="col-sm-7">
                    <input type="password" class="col-12" id="matrixPassword" v-model="syncConfig.password"/>
                </div>
            </div>
            <div class="row">
                <label class="col-sm-3" for="homeserver">{{ $t('homeserver') }}</label>
                <div class="col-sm-7">
                    <input type="text" class="col-12" id="homeserver" v-model="syncConfig.homeserver" placeholder="https://matrix.org"/>
                </div>
            </div>
            <div class="mt-4">
                <button class="me-4" @click="login" :disabled="!loginEnabled">
                    <i v-if="loginLoading" class="fas fa-spinner fa-spin"></i>
                    <i v-if="!loginLoading" class="fas fa-sign-in-alt"></i>
                    <span>{{ $t('login') }}</span>
                </button>
                <span v-if="loginResult === LOGIN_RESULTS.UNAUTHORIZED" style="color: red"><i class="fas fa-times"></i> {{ $t('ERROR_CODE_UNAUTHORIZED') }}</span>
                <span v-if="loginResult === LOGIN_RESULTS.NETWORK_ERROR" style="color: red"><i class="fas fa-times"></i> {{ $t('ERROR_CODE_NETWORK_ERROR') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
    import '../../../css/modal.css';
    import { matrixService } from '../../../js/service/matrixMessenger/matrixService';
    import { dataService } from '../../../js/service/data/dataService';
    import { MatrixConfigSync } from '../../../js/model/MatrixConfigSync';

    export default {
        components: { },
        props: ["loggedInUser"],
        data: function () {
            return {
                metadata: null,
                logoutLoading: false,
                loginLoading: false,
                syncConfig: new MatrixConfigSync(),
                loginResult: null,
                LOGIN_RESULTS: matrixService.LOGIN_RESULTS,
                e2eeSupported: undefined
            }
        },
        computed: {
            loginEnabled() {
                return this.syncConfig.user && this.syncConfig.password && this.syncConfig.homeserver;
            }
        },
        methods: {
            async logout() {
                this.loginResult = null;
                this.logoutLoading = true;
                this.syncConfig = new MatrixConfigSync();
                await matrixService.logout();
                this.metadata.integrations.matrixConfig = new MatrixConfigSync();
                await dataService.saveMetadata(this.metadata);
                this.$emit("user", (await matrixService.getUsername()));
                this.logoutLoading = false;
            },
            async login() {
                this.loginResult = null;
                this.loginLoading = true;
                this.loginResult = await matrixService.login(this.syncConfig);
                if (this.loginResult === this.LOGIN_RESULTS.SUCCESS) {
                    this.metadata.integrations.matrixConfig = this.syncConfig;
                    await dataService.saveMetadata(this.metadata);
                }
                this.e2eeSupported = matrixService.isEncryptionEnabled();
                this.$emit("user", (await matrixService.getUsername()));
                this.loginLoading = false;
            }
        },
        async mounted() {
            this.metadata = await dataService.getMetadata();
            this.e2eeSupported = matrixService.isEncryptionEnabled();
        },
        beforeDestroy() {
        }
    }
</script>

<style scoped>
.row {
    margin-bottom: 1em;
}
</style>