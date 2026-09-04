import { handheldCodeReaderService, createCooldownGate, mapMediaError, mapFormats } from './handheldCodeReaderService';

function setSecure(value) {
    Object.defineProperty(global.window, 'isSecureContext', { value, configurable: true });
}

function setMediaDevices(value) {
    Object.defineProperty(global.navigator, 'mediaDevices', { value, configurable: true });
}

afterEach(() => {
    handheldCodeReaderService.stop();
    setMediaDevices(undefined);
    setSecure(true);
});

describe('createCooldownGate', () => {
    test('blocks the same text within the cooldown window, lets different text through', () => {
        let gate = createCooldownGate(1000);
        expect(gate('a', 0)).toBe(true);
        expect(gate('a', 500)).toBe(false); // same text, still within cooldown
        expect(gate('b', 600)).toBe(true); // different text always passes
        expect(gate('a', 1100)).toBe(true); // last text was 'b', so 'a' passes again
        expect(gate('a', 1500)).toBe(false); // within cooldown of previous 'a'
        expect(gate('a', 2200)).toBe(true); // cooldown elapsed
    });
});

describe('mapMediaError', () => {
    test('maps known DOMException names to typed codes', () => {
        expect(mapMediaError({ name: 'NotAllowedError' })).toBe(handheldCodeReaderService.ERROR_PERMISSION_DENIED);
        expect(mapMediaError({ name: 'NotFoundError' })).toBe(handheldCodeReaderService.ERROR_NO_CAMERA);
        expect(mapMediaError({ name: 'NotReadableError' })).toBe(handheldCodeReaderService.ERROR_CAMERA_IN_USE);
        expect(mapMediaError({ name: 'SomethingElse' })).toBe(handheldCodeReaderService.ERROR_UNKNOWN);
        expect(mapMediaError(null)).toBe(handheldCodeReaderService.ERROR_UNKNOWN);
    });
});

describe('mapFormats', () => {
    let BarcodeFormat = { DATA_MATRIX: 5, QR_CODE: 11, AZTEC: 0 };

    test('maps known format names to numeric values and drops unknown ones', () => {
        expect(mapFormats(['DATA_MATRIX', 'QR_CODE', 'NOPE'], BarcodeFormat)).toEqual([5, 11]);
    });

    test('keeps formats whose enum value is 0', () => {
        expect(mapFormats(['AZTEC'], BarcodeFormat)).toEqual([0]);
    });

    test('returns empty array for invalid input', () => {
        expect(mapFormats(null, BarcodeFormat)).toEqual([]);
        expect(mapFormats(['DATA_MATRIX'], null)).toEqual([]);
    });
});

describe('isSupported', () => {
    test('true when secure context and getUserMedia exist', () => {
        setSecure(true);
        setMediaDevices({ getUserMedia: () => {} });
        expect(handheldCodeReaderService.isSupported()).toBe(true);
    });

    test('false without mediaDevices', () => {
        setSecure(true);
        setMediaDevices(undefined);
        expect(handheldCodeReaderService.isSupported()).toBe(false);
    });

    test('false in an insecure context', () => {
        setSecure(false);
        setMediaDevices({ getUserMedia: () => {} });
        expect(handheldCodeReaderService.isSupported()).toBe(false);
    });
});

describe('listCameras', () => {
    test('returns only video input devices mapped to {deviceId, label}', async () => {
        setMediaDevices({
            enumerateDevices: async () => [
                { kind: 'videoinput', deviceId: 'cam1', label: 'Microscope' },
                { kind: 'audioinput', deviceId: 'mic1', label: 'Mic' },
                { kind: 'videoinput', deviceId: 'cam2', label: 'Webcam' }
            ]
        });
        let cameras = await handheldCodeReaderService.listCameras();
        expect(cameras).toEqual([
            { deviceId: 'cam1', label: 'Microscope' },
            { deviceId: 'cam2', label: 'Webcam' }
        ]);
    });

    test('throws NOT_SUPPORTED without enumerateDevices', async () => {
        setMediaDevices(undefined);
        await expect(handheldCodeReaderService.listCameras()).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_NOT_SUPPORTED
        );
    });
});

describe('requestPermission', () => {
    test('rejects with INSECURE_CONTEXT in an insecure context', async () => {
        setSecure(false);
        setMediaDevices({ getUserMedia: () => {} });
        await expect(handheldCodeReaderService.requestPermission()).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_INSECURE_CONTEXT
        );
    });

    test('rejects with NOT_SUPPORTED without getUserMedia', async () => {
        setSecure(true);
        setMediaDevices(undefined);
        await expect(handheldCodeReaderService.requestPermission()).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_NOT_SUPPORTED
        );
    });

    test('grants permission, releases the temporary stream and returns labelled cameras', async () => {
        setSecure(true);
        let stop1 = jest.fn();
        let stop2 = jest.fn();
        let getUserMedia = jest.fn(async () => ({ getTracks: () => [{ stop: stop1 }, { stop: stop2 }] }));
        setMediaDevices({
            getUserMedia,
            enumerateDevices: async () => [
                { kind: 'videoinput', deviceId: 'cam1', label: 'Microscope' },
                { kind: 'audioinput', deviceId: 'mic1', label: 'Mic' }
            ]
        });
        let cameras = await handheldCodeReaderService.requestPermission();
        expect(getUserMedia).toHaveBeenCalledWith({ video: true });
        expect(stop1).toHaveBeenCalled();
        expect(stop2).toHaveBeenCalled();
        expect(cameras).toEqual([{ deviceId: 'cam1', label: 'Microscope' }]);
    });

    test('maps a denied permission to PERMISSION_DENIED', async () => {
        setSecure(true);
        setMediaDevices({
            getUserMedia: async () => {
                throw { name: 'NotAllowedError' };
            },
            enumerateDevices: async () => []
        });
        await expect(handheldCodeReaderService.requestPermission()).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_PERMISSION_DENIED
        );
    });
});

describe('start - guard paths', () => {
    test('rejects with INSECURE_CONTEXT in an insecure context', async () => {
        setSecure(false);
        setMediaDevices({ getUserMedia: () => {} });
        await expect(handheldCodeReaderService.start({ videoElement: {} })).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_INSECURE_CONTEXT
        );
    });

    test('rejects with NOT_SUPPORTED without mediaDevices', async () => {
        setSecure(true);
        setMediaDevices(undefined);
        await expect(handheldCodeReaderService.start({ videoElement: {} })).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_NOT_SUPPORTED
        );
    });

    test('rejects with UNKNOWN when no video element is provided', async () => {
        setSecure(true);
        setMediaDevices({ getUserMedia: () => {} });
        await expect(handheldCodeReaderService.start({})).rejects.toHaveProperty(
            'code',
            handheldCodeReaderService.ERROR_UNKNOWN
        );
    });
});

describe('start - decoding', () => {
    test('decodes and fires onResult once per cooldown, then releases on stop', async () => {
        setSecure(true);
        setMediaDevices({ getUserMedia: () => {} });

        let capturedCallback = null;
        let controls = { stop: jest.fn() };
        let MockReader = class {
            constructor(hints, options) {
                this.hints = hints;
                this.options = options;
            }
            decodeFromVideoDevice(deviceId, videoElement, callback) {
                capturedCallback = callback;
                return Promise.resolve(controls);
            }
        };
        handheldCodeReaderService._loadZXing = async () => ({
            BrowserMultiFormatReader: MockReader,
            BarcodeFormat: { DATA_MATRIX: 5, QR_CODE: 11, AZTEC: 0 },
            DecodeHintType: { POSSIBLE_FORMATS: 2, TRY_HARDER: 3 }
        });

        let onResult = jest.fn();
        let videoElement = { srcObject: null };
        await handheldCodeReaderService.start({
            videoElement,
            deviceId: 'cam1',
            formats: ['DATA_MATRIX', 'QR_CODE'],
            cooldownMs: 10000,
            onResult
        });

        expect(handheldCodeReaderService.isRunning()).toBe(true);
        expect(typeof capturedCallback).toBe('function');

        capturedCallback(undefined); // no code in frame -> ignored
        capturedCallback({ getText: () => 'grid-element-x' }); // fires
        capturedCallback({ getText: () => 'grid-element-x' }); // same code within cooldown -> ignored

        expect(onResult).toHaveBeenCalledTimes(1);
        expect(onResult).toHaveBeenCalledWith('grid-element-x');

        handheldCodeReaderService.stop();
        expect(controls.stop).toHaveBeenCalled();
        expect(handheldCodeReaderService.isRunning()).toBe(false);
    });
});
