import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { L } from '../util/lquery.js';
import { actionService } from '../service/actionService';
import { i18nService } from '../service/i18nService';
import { resolveHandheldCodePayloadToElementId } from './handheldCodeReaderMapping';

/**
 * USB / webcam scanner using ZXing continuous decode (QR, Data Matrix, Aztec).
 */
class HandheldCodeReader {
    constructor() {
        this.reader = null;
        this.videoElement = null;
        this.previewContainer = null;
        this.statusElement = null;
        this.lockUntil = 0;
        this.statusResetTimer = null;
        this.scannerControls = null;
    }

    /**
     * @param {object} options
     * @param {object} options.inputConfig metadata.inputConfig (handheld* fields)
     * @param {function(): object|null} options.getGridData current render grid
     * @param {HTMLElement|null} options.previewContainer mount for video + status
     */
    start(options) {
        let inputConfig = options.inputConfig;
        let getGridData = options.getGridData;
        let previewContainer = options.previewContainer;

        if (!inputConfig.handheldCodeReaderEnabled || !getGridData) {
            return;
        }

        if (!window.isSecureContext) {
            log.warn(
                'handheldCodeReader: camera needs HTTPS or localhost (insecure context). Open the app via HTTPS or use http://localhost for development.'
            );
            return;
        }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            log.warn('handheldCodeReader: navigator.mediaDevices not available (browser / context).');
            return;
        }

        let hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.DATA_MATRIX,
            BarcodeFormat.AZTEC
        ]);
        this.reader = new BrowserMultiFormatReader(hints);

        this.previewContainer = previewContainer;
        this.videoElement = document.createElement('video');
        this.videoElement.setAttribute('playsinline', 'true');
        this.videoElement.setAttribute('muted', 'true');

        let wrapper = null;
        let status = null;
        if (previewContainer) {
            wrapper = document.createElement('div');
            wrapper.className = 'handheld-code-reader-preview';
            let frame = document.createElement('div');
            frame.className = 'handheld-code-reader-video-frame';
            frame.appendChild(this.videoElement);
            status = document.createElement('div');
            status.className = 'handheld-code-reader-status handheld-code-reader-status--idle';
            status.setAttribute('aria-live', 'polite');
            status.textContent = '';
            frame.appendChild(status);
            wrapper.appendChild(frame);
            previewContainer.innerHTML = '';
            previewContainer.appendChild(wrapper);
            this.statusElement = status;
            this.applyPreviewVisibility(this.videoElement, previewContainer, inputConfig.handheldCodeReaderPreview);
        }

        let deviceId = inputConfig.handheldCodeReaderDeviceId || null;
        if (deviceId === '') {
            deviceId = undefined;
        }
        let lockMs = Math.max(100, Number(inputConfig.handheldCodeReaderLockMs) || 0);

        let thiz = this;
        this.reader
            .decodeFromVideoDevice(deviceId, this.videoElement, (result, err, controls) => {
                if (controls) {
                    thiz.scannerControls = controls;
                }
                if (err) {
                    if (err instanceof NotFoundException) {
                        return;
                    }
                    log.debug('handheldCodeReader decode: ' + err);
                    return;
                }
                if (!result) {
                    return;
                }
                let text = result.getText();
                let gridData = getGridData();
                let elementId = resolveHandheldCodePayloadToElementId(gridData, text);
                if (!gridData) {
                    return;
                }
                if (!elementId) {
                    thiz.flashStatus('mismatch', 'handheldCodeReaderGridMismatch');
                    return;
                }
                let now = Date.now();
                if (now < thiz.lockUntil) {
                    return;
                }
                thiz.lockUntil = now + lockMs;
                thiz.flashStatus('ok', 'handheldCodeReaderCodeDetected');

                let item = document.getElementById(elementId);
                if (item) {
                    L.removeAddClass(item, 'selected');
                }
                actionService.doAction(gridData, elementId);
            })
            .catch((e) => {
                log.warn('handheldCodeReader failed to start: ' + e);
            });
    }

    applyPreviewVisibility(video, container, preview) {
        if (!container) {
            return;
        }
        container.classList.toggle('handheld-code-reader-mount--hidden', !preview);
        if (preview) {
            video.classList.add('handheld-code-reader-video');
        } else {
            video.classList.remove('handheld-code-reader-video');
        }
    }

    flashStatus(kind, i18nKey) {
        if (!this.statusElement) {
            return;
        }
        let el = this.statusElement;
        el.classList.remove(
            'handheld-code-reader-status--idle',
            'handheld-code-reader-status--detected',
            'handheld-code-reader-status--mismatch'
        );
        if (kind === 'ok') {
            el.classList.add('handheld-code-reader-status--detected');
        } else if (kind === 'mismatch') {
            el.classList.add('handheld-code-reader-status--mismatch');
        } else {
            el.classList.add('handheld-code-reader-status--idle');
        }
        el.textContent = i18nService.t(i18nKey);
        clearTimeout(this.statusResetTimer);
        let thiz = this;
        this.statusResetTimer = setTimeout(function () {
            if (!thiz.statusElement) {
                return;
            }
            thiz.statusElement.classList.remove('handheld-code-reader-status--detected', 'handheld-code-reader-status--mismatch');
            thiz.statusElement.classList.add('handheld-code-reader-status--idle');
            thiz.statusElement.textContent = '';
        }, 1500);
    }

    destroy() {
        clearTimeout(this.statusResetTimer);
        this.statusResetTimer = null;
        if (this.scannerControls) {
            try {
                this.scannerControls.stop();
            } catch (e) {
                log.debug('handheldCodeReader stop: ' + e);
            }
            this.scannerControls = null;
        }
        this.reader = null;
        if (this.videoElement && this.videoElement.srcObject) {
            let tracks = this.videoElement.srcObject.getTracks();
            tracks.forEach((t) => t.stop());
            this.videoElement.srcObject = null;
        }
        if (this.previewContainer) {
            this.previewContainer.innerHTML = '';
            this.previewContainer.classList.add('handheld-code-reader-mount--hidden');
        }
        this.videoElement = null;
        this.statusElement = null;
        this.previewContainer = null;
    }
}

export { HandheldCodeReader };
