<template>
    <div class="code-reader-bar" role="region" :aria-label="$t('codeReaderInput')">
        <div class="cr-row">
            <span class="cr-title"><i class="fas fa-qrcode" aria-hidden="true"></i> {{ $t('codeReaderInput') }}</span>

            <template v-if="supported">
                <label class="cr-camera-label" for="codeReaderCameraSelectBar">{{ $t('codeReaderCamera') }}</label>
                <select id="codeReaderCameraSelectBar" class="cr-select" v-model="selectedDeviceId" @change="onCameraChange()" :disabled="running">
                    <option v-for="(cam, index) in cameras" :key="cam.deviceId || index" :value="cam.deviceId">
                        {{ cam.label || $t('codeReaderCameraFallbackName', [index + 1]) }}
                    </option>
                </select>

                <button v-if="!running" class="cr-btn" @click="start()" :disabled="starting">
                    <i class="fas fa-play" aria-hidden="true"></i> <span>{{ $t('codeReaderStart') }}</span>
                </button>
                <button v-else class="cr-btn" @click="stop()">
                    <i class="fas fa-stop" aria-hidden="true"></i> <span>{{ $t('codeReaderStop') }}</span>
                </button>

                <button v-if="running" class="cr-icon-btn" @click="showPreview = !showPreview"
                        :aria-label="showPreview ? $t('codeReaderHidePreview') : $t('codeReaderShowPreview')"
                        :title="showPreview ? $t('codeReaderHidePreview') : $t('codeReaderShowPreview')">
                    <i :class="showPreview ? 'fas fa-eye-slash' : 'fas fa-eye'" aria-hidden="true"></i>
                </button>
            </template>

            <span class="cr-status" :class="'cr-status-' + statusType" aria-live="polite">{{ statusMessage }}</span>

            <button class="cr-btn cr-btn-deactivate" @click="deactivate()" :title="$t('codeReaderDeactivate')">
                <i class="fas fa-power-off" aria-hidden="true"></i> <span>{{ $t('codeReaderDeactivate') }}</span>
            </button>
        </div>

        <!--
            A single video element is reused for the whole session so the camera stream stays attached.
            When the preview is hidden it is moved off-screen (1px) instead of display:none, so decoding
            keeps running.
        -->
        <div class="cr-preview" v-show="running || starting">
            <video ref="video" :class="showPreview ? 'cr-video' : 'cr-video-hidden'" muted autoplay playsinline></video>
        </div>
    </div>
</template>

<script>
    import { handheldCodeReaderService } from '../../js/service/handheldCodeReaderService.js';
    import { codeReaderMatcher } from '../../js/util/codeReaderMatcher.js';
    import { actionService } from '../../js/service/actionService.js';
    import { i18nService } from '../../js/service/i18nService.js';
    import { localStorageService } from '../../js/service/data/localStorageService.js';
    import { GridElement } from '../../js/model/GridElement.js';

    const ERROR_KEY_MAP = {
        NOT_SUPPORTED: 'codeReaderErrorNotSupported',
        INSECURE_CONTEXT: 'codeReaderErrorInsecureContext',
        NO_CAMERA: 'codeReaderErrorNoCamera',
        PERMISSION_DENIED: 'codeReaderErrorPermissionDenied',
        CAMERA_IN_USE: 'codeReaderErrorCameraInUse',
        UNKNOWN: 'codeReaderErrorUnknown'
    };

    export default {
        props: {
            gridData: Object,
            inputConfig: Object
        },
        data: function () {
            return {
                supported: false,
                cameras: [],
                selectedDeviceId: null,
                running: false,
                starting: false,
                showPreview: true,
                statusType: 'idle', // idle | active | match | noMatch | error
                statusArg: ''
            };
        },
        computed: {
            statusMessage() {
                switch (this.statusType) {
                    case 'active':
                        return this.$t('codeReaderStatusActive');
                    case 'match':
                        return this.$t('codeReaderStatusMatch', [this.statusArg]);
                    case 'noMatch':
                        return this.$t('codeReaderStatusNoMatch', [this.statusArg]);
                    case 'error':
                        return this.$t(ERROR_KEY_MAP[this.statusArg] || ERROR_KEY_MAP.UNKNOWN);
                    default:
                        return this.$t('codeReaderStatusReady');
                }
            },
            configSignature() {
                let formats = this.inputConfig && Array.isArray(this.inputConfig.codeReaderFormats)
                    ? this.inputConfig.codeReaderFormats.join(',')
                    : '';
                let cooldown = this.inputConfig ? this.inputConfig.codeReaderCooldownMs : '';
                return formats + '|' + cooldown;
            }
        },
        watch: {
            configSignature() {
                // re-apply changed decoding settings (formats / cooldown) to a running session
                if (this.running) {
                    this.restart();
                }
            }
        },
        methods: {
            async loadCameras() {
                try {
                    this.cameras = await handheldCodeReaderService.listCameras();
                } catch (error) {
                    this.cameras = [];
                    return;
                }
                let ids = this.cameras.map((cam) => cam.deviceId);
                if (!this.selectedDeviceId || !ids.includes(this.selectedDeviceId)) {
                    this.selectedDeviceId = this.cameras.length > 0 ? this.cameras[0].deviceId : null;
                }
            },
            async start() {
                if (!this.supported || this.starting) {
                    return;
                }
                this.starting = true;
                try {
                    await handheldCodeReaderService.start({
                        videoElement: this.$refs.video,
                        deviceId: this.selectedDeviceId || undefined,
                        formats: this.inputConfig.codeReaderFormats,
                        cooldownMs: this.inputConfig.codeReaderCooldownMs,
                        onResult: (text) => this.onDecoded(text)
                    });
                    this.running = true;
                    this.statusType = 'active';
                    this.persistCamera();
                    // permission is granted now, so real device labels become available
                    await this.loadCameras();
                } catch (error) {
                    this.running = false;
                    this.statusType = 'error';
                    this.statusArg = error && error.code ? error.code : 'UNKNOWN';
                } finally {
                    this.starting = false;
                }
            },
            stop() {
                handheldCodeReaderService.stop();
                this.running = false;
                this.statusType = 'idle';
            },
            async restart() {
                let wasRunning = this.running;
                handheldCodeReaderService.stop();
                this.running = false;
                if (wasRunning) {
                    await this.start();
                }
            },
            onCameraChange() {
                this.persistCamera();
                if (this.running) {
                    this.restart();
                }
            },
            persistCamera() {
                localStorageService.saveUserSettings({ lastCodeReaderCameraId: this.selectedDeviceId || null });
            },
            onDecoded(text) {
                let elements = this.gridData && Array.isArray(this.gridData.gridElements)
                    ? this.gridData.gridElements.filter((e) => e.type !== GridElement.ELEMENT_TYPE_UI_FILLER)
                    : [];
                let match = codeReaderMatcher.findMatchingElement(text, elements, {
                    matchMode: this.inputConfig.codeReaderMatchMode
                });
                if (match) {
                    this.statusType = 'match';
                    this.statusArg = i18nService.getTranslation(match.label) || text;
                    actionService.doAction(this.gridData, match.id);
                } else {
                    this.statusType = 'noMatch';
                    this.statusArg = text;
                }
            },
            deactivate() {
                if (!confirm(i18nService.t('codeReaderDeactivateConfirm'))) {
                    return;
                }
                if (this.running) {
                    handheldCodeReaderService.stop();
                    this.running = false;
                }
                this.$emit('deactivate');
            }
        },
        mounted() {
            this.supported = handheldCodeReaderService.isSupported();
            let settings = localStorageService.getUserSettings();
            this.selectedDeviceId = settings ? settings.lastCodeReaderCameraId || null : null;
            if (this.supported) {
                // labels are filled once permission was granted (in settings or on a previous start)
                this.loadCameras();
            } else {
                this.statusType = 'error';
                this.statusArg = typeof window !== 'undefined' && window.isSecureContext === false ? 'INSECURE_CONTEXT' : 'NOT_SUPPORTED';
            }
        },
        beforeDestroy() {
            handheldCodeReaderService.stop();
        }
    };
</script>

<style scoped>
    .code-reader-bar {
        background-color: #f0f4f8;
        border-bottom: 1px solid #c8d2dc;
        padding: 0.3em 0.6em;
        font-size: 1.15em;
    }

    .cr-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5em;
    }

    .cr-title {
        font-weight: bold;
        white-space: nowrap;
    }

    .cr-camera-label {
        margin: 0;
    }

    .cr-select {
        max-width: 14em;
        margin: 0;
    }

    .cr-btn,
    .cr-icon-btn {
        margin: 0;
        padding: 0.2em 0.6em;
        min-height: 0;
    }

    .cr-btn-deactivate {
        margin-left: auto;
    }

    .cr-status {
        flex: 1 1 12em;
        min-width: 8em;
    }

    .cr-status-match {
        color: #016619;
        font-weight: bold;
    }

    .cr-status-noMatch {
        color: #99580b;
    }

    .cr-status-error {
        color: #cc0000;
    }

    .cr-video {
        width: 100%;
        max-width: 280px;
        height: auto;
        max-height: 210px;
        margin-top: 0.3em;
        background-color: #000000;
        border: 1px solid #c8d2dc;
    }

    .cr-video-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
    }
</style>
