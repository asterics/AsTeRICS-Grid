/**
 * Handheld code reader input service.
 *
 * Drives an optional handheld digital microscope (a normal UVC webcam) that reads tiny visual
 * codes (DataMatrix, QR, Aztec) off physical communication cards. It only handles the camera and
 * the decoding; matching a decoded text to a grid element and triggering its action is done by the
 * consumer (the handheld code reader bar), so this service stays free of grid/action dependencies.
 *
 * The ZXing decoding library is loaded lazily via dynamic import the first time the reader is
 * started, so it never ends up in the main application bundle.
 *
 * The service never starts the camera on its own - the user has to start it explicitly.
 */

let handheldCodeReaderService = {};

// typed error codes, mapped to user facing i18n messages by the consumer
handheldCodeReaderService.ERROR_NOT_SUPPORTED = 'NOT_SUPPORTED';
handheldCodeReaderService.ERROR_INSECURE_CONTEXT = 'INSECURE_CONTEXT';
handheldCodeReaderService.ERROR_NO_CAMERA = 'NO_CAMERA';
handheldCodeReaderService.ERROR_PERMISSION_DENIED = 'PERMISSION_DENIED';
handheldCodeReaderService.ERROR_CAMERA_IN_USE = 'CAMERA_IN_USE';
handheldCodeReaderService.ERROR_UNKNOWN = 'UNKNOWN';

let _running = false;
let _controls = null; // ZXing IScannerControls of the running session
let _videoElement = null;

/**
 * creates a stateful gate that lets the same decoded text pass at most once per cooldown window.
 * Different texts always pass immediately. Kept pure (no globals) so it is easy to unit test.
 * @param cooldownMs minimum time in ms before the same text may pass again
 * @return {(text: string, nowMs: number) => boolean} function returning true if the text may fire
 */
function createCooldownGate(cooldownMs) {
    let lastText = null;
    let lastTime = 0;
    return function (text, nowMs) {
        if (text === lastText && nowMs - lastTime < cooldownMs) {
            return false;
        }
        lastText = text;
        lastTime = nowMs;
        return true;
    };
}

/**
 * maps a getUserMedia / MediaStream error to one of the typed ERROR_* codes.
 * @param error the caught error (typically a DOMException)
 * @return {string} one of the handheldCodeReaderService.ERROR_* codes
 */
function mapMediaError(error) {
    let name = error && error.name;
    switch (name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return handheldCodeReaderService.ERROR_PERMISSION_DENIED;
        case 'NotFoundError':
        case 'OverconstrainedError':
        case 'DevicesNotFoundError':
            return handheldCodeReaderService.ERROR_NO_CAMERA;
        case 'NotReadableError':
        case 'TrackStartError':
        case 'AbortError':
            return handheldCodeReaderService.ERROR_CAMERA_IN_USE;
        default:
            return handheldCodeReaderService.ERROR_UNKNOWN;
    }
}

/**
 * maps an array of ZXing BarcodeFormat names (e.g. 'DATA_MATRIX') to their numeric enum values.
 * Unknown names are dropped.
 * @param formatNames array of format name strings
 * @param BarcodeFormat the ZXing BarcodeFormat enum
 * @return {number[]} numeric barcode formats
 */
function mapFormats(formatNames, BarcodeFormat) {
    if (!Array.isArray(formatNames) || !BarcodeFormat) {
        return [];
    }
    return formatNames.map((name) => BarcodeFormat[name]).filter((value) => value !== undefined && value !== null);
}

/**
 * creates a typed error carrying one of the ERROR_* codes.
 */
function createError(code, cause) {
    let error = new Error('handheldCodeReader: ' + code);
    error.code = code;
    if (cause) {
        error.cause = cause;
    }
    return error;
}

function getMediaDevices() {
    return typeof navigator !== 'undefined' && navigator.mediaDevices ? navigator.mediaDevices : null;
}

/**
 * lazily loads the ZXing decoding library (dynamic import keeps it out of the main bundle).
 * Exposed on the service so it can be overridden in unit tests.
 * @return {Promise<{BrowserMultiFormatReader: Function, BarcodeFormat: Object, DecodeHintType: Object}>}
 */
handheldCodeReaderService._loadZXing = async function () {
    let [browserModule, libraryModule] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
    return {
        BrowserMultiFormatReader: browserModule.BrowserMultiFormatReader,
        BarcodeFormat: browserModule.BarcodeFormat,
        DecodeHintType: libraryModule.DecodeHintType
    };
};

/**
 * @return {boolean} true if this environment can run the code reader (secure context + camera API)
 */
handheldCodeReaderService.isSupported = function () {
    let mediaDevices = getMediaDevices();
    let secure = typeof window === 'undefined' || window.isSecureContext !== false;
    return !!(mediaDevices && mediaDevices.getUserMedia && secure);
};

/**
 * @return {boolean} true if a decoding session is currently running
 */
handheldCodeReaderService.isRunning = function () {
    return _running;
};

/**
 * lists available video input devices. Does NOT start the camera.
 * Device labels are only available once camera permission has been granted at least once.
 * @return {Promise<Array<{deviceId: string, label: string}>>}
 */
handheldCodeReaderService.listCameras = async function () {
    let mediaDevices = getMediaDevices();
    if (!mediaDevices || !mediaDevices.enumerateDevices) {
        throw createError(handheldCodeReaderService.ERROR_NOT_SUPPORTED);
    }
    let devices = await mediaDevices.enumerateDevices();
    return devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({ deviceId: device.deviceId, label: device.label }));
};

/**
 * requests camera permission once (showing the browser permission prompt) and releases the camera
 * again right away. Used by the settings UI so the user grants access while confirming the
 * configuration; device labels become available afterwards and a later start needs no second prompt.
 * This never starts a decoding session.
 * @return {Promise<Array<{deviceId: string, label: string}>>} the camera list (with labels once granted)
 */
handheldCodeReaderService.requestPermission = async function () {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
        throw createError(handheldCodeReaderService.ERROR_INSECURE_CONTEXT);
    }
    let mediaDevices = getMediaDevices();
    if (!mediaDevices || !mediaDevices.getUserMedia) {
        throw createError(handheldCodeReaderService.ERROR_NOT_SUPPORTED);
    }
    let stream;
    try {
        stream = await mediaDevices.getUserMedia({ video: true });
    } catch (error) {
        throw createError(mapMediaError(error), error);
    }
    // release the camera immediately - only the permission grant was needed, not a live stream
    if (stream && stream.getTracks) {
        stream.getTracks().forEach((track) => track.stop());
    }
    return handheldCodeReaderService.listCameras();
};

/**
 * starts a continuous decoding session. Never called automatically - only on explicit user action.
 *
 * @param options.videoElement the HTMLVideoElement used to show / process the camera preview
 * @param options.deviceId optional deviceId of the camera to use (undefined = default camera)
 * @param options.formats array of ZXing BarcodeFormat names to decode (e.g. ['DATA_MATRIX'])
 * @param options.cooldownMs minimum time before the same code fires again (default 1500)
 * @param options.onResult callback invoked with the decoded text on each (debounced) successful read
 * @return {Promise<void>} resolves once decoding has started; rejects with a typed error otherwise
 */
handheldCodeReaderService.start = async function (options) {
    options = options || {};
    if (_running) {
        handheldCodeReaderService.stop();
    }
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
        throw createError(handheldCodeReaderService.ERROR_INSECURE_CONTEXT);
    }
    let mediaDevices = getMediaDevices();
    if (!mediaDevices || !mediaDevices.getUserMedia) {
        throw createError(handheldCodeReaderService.ERROR_NOT_SUPPORTED);
    }
    if (!options.videoElement) {
        throw createError(handheldCodeReaderService.ERROR_UNKNOWN);
    }

    let BrowserMultiFormatReader, BarcodeFormat, DecodeHintType;
    try {
        // lazy load ZXing so it stays out of the main bundle
        let zxing = await handheldCodeReaderService._loadZXing();
        BrowserMultiFormatReader = zxing.BrowserMultiFormatReader;
        BarcodeFormat = zxing.BarcodeFormat;
        DecodeHintType = zxing.DecodeHintType;
    } catch (error) {
        throw createError(handheldCodeReaderService.ERROR_UNKNOWN, error);
    }

    let hints = new Map();
    let formats = mapFormats(options.formats, BarcodeFormat);
    if (formats.length > 0) {
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    }
    hints.set(DecodeHintType.TRY_HARDER, true);

    let cooldownMs = typeof options.cooldownMs === 'number' ? options.cooldownMs : 1500;
    let gate = createCooldownGate(cooldownMs);
    let onResult = typeof options.onResult === 'function' ? options.onResult : function () {};

    let reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 });
    _videoElement = options.videoElement;

    try {
        _controls = await reader.decodeFromVideoDevice(
            options.deviceId || undefined,
            options.videoElement,
            (result) => {
                // result is undefined when no code is found in the current frame - that is normal
                if (!result) {
                    return;
                }
                let text = result.getText ? result.getText() : result.text;
                if (text && gate(text, Date.now())) {
                    onResult(text);
                }
            }
        );
    } catch (error) {
        handheldCodeReaderService.stop();
        throw createError(mapMediaError(error), error);
    }
    _running = true;
};

/**
 * stops the running decoding session and releases the camera stream.
 */
handheldCodeReaderService.stop = function () {
    if (_controls) {
        try {
            _controls.stop();
        } catch (error) {
            // ignore - controls may already be stopped
        }
        _controls = null;
    }
    if (_videoElement) {
        let stream = _videoElement.srcObject;
        if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => track.stop());
        }
        _videoElement.srcObject = null;
        _videoElement = null;
    }
    _running = false;
};

export { handheldCodeReaderService, createCooldownGate, mapMediaError, mapFormats };
