import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

/**
 * facelandmarkerService
 * - Manages MediaPipe FaceLandmarker lifecycle and camera stream
 * - Allows subscribers to receive gesture callbacks and diagnostic frames
 * - Uses CDN for WASM files (via FilesetResolver.forVisionTasks)
 */
const facelandmarkerService = (function () {
    let state = 'idle'; // idle | initializing | running | error
    let error = null;
    let videoEl = null;
    let stream = null;
    let landmarker = null;
    let rafId = null;
    let subscribers = new Map(); // id -> { gesture, callback, lastTrigger, dwellStart }
    let diagSubscribers = new Set(); // functions receiving diagnostic payload
    let nextId = 1;

    // Pin the WASM runtime to the same version as the npm dependency to avoid mismatch errors
    const CDN_WASM_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
    // Model asset (.task) hosted by MediaPipe
    const MODEL_TASK_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

    async function ensureInitialized() {
        if (landmarker) return;
        state = 'initializing';
        try {
            const fileset = await FilesetResolver.forVisionTasks(CDN_WASM_PATH);
            // Try GPU first, then gracefully fall back to CPU
            try {
                landmarker = await FaceLandmarker.createFromOptions(fileset, {
                    baseOptions: {
                        modelAssetPath: MODEL_TASK_URL,
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrices: true
                });
            } catch (gpuErr) {
                landmarker = await FaceLandmarker.createFromOptions(fileset, {
                    baseOptions: {
                        modelAssetPath: MODEL_TASK_URL,
                        delegate: 'CPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    outputFaceBlendshapes: true,
                    outputFacialTransformationMatrices: true
                });
            }
            state = 'idle';
        } catch (e) {
            state = 'error';
            error = e;
            throw e;
        }
    }

    async function ensureCamera() {
        if (videoEl && stream) return;
        videoEl = document.createElement('video');
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoEl.srcObject = stream;
            await videoEl.play();
        } catch (e) {
            state = 'error';
            error = e;
            throw e;
        }
    }

    function hasActiveSubscribers() {
        return subscribers.size > 0 || diagSubscribers.size > 0;
    }

    async function start() {
        if (state === 'running') return;
        await ensureInitialized();
        await ensureCamera();
        state = 'running';
        loop();
    }

    function stop() {
        state = 'idle';
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        if (landmarker) {
            // keep loaded for fast resume
        }
        if (stream && stream.getTracks) {
            stream.getTracks().forEach(t => t.stop());
        }
        stream = null;
        videoEl = null;
    }

    function subscribe(gestureDescriptor, callback) {
        const id = nextId++;
        subscribers.set(id, { gesture: gestureDescriptor, callback, lastTrigger: 0, dwellStart: 0 });
        return () => {
            subscribers.delete(id);
            if (!hasActiveSubscribers() && state === 'running') {
                stop();
            }
        };
    }

    function subscribeDiagnostics(callback) {
        diagSubscribers.add(callback);
        return () => {
            diagSubscribers.delete(callback);
        };
    }

    function notifyDiagnostics(payload) {
        if (diagSubscribers.size === 0) return;
        diagSubscribers.forEach(fn => {
            try { fn(payload); } catch (e) {}
        });
    }

    function loop() {
        if (state !== 'running') return;
        rafId = requestAnimationFrame(loop);
        if (!videoEl || !landmarker) return;
        const ts = performance.now();
        const result = landmarker.detectForVideo(videoEl, ts);
        if (!result || !result.faceBlendshapes || result.faceBlendshapes.length === 0) {
            notifyDiagnostics({ ok: false });
            return;
        }
        const blend = indexBlendshapes(result.faceBlendshapes[0]);
        const mat = (result.facialTransformationMatrixes && result.facialTransformationMatrixes[0]) || null;
        const landmarks = (result.faceLandmarks && result.faceLandmarks[0]) || [];

        const diag = { ok: true, blend, mat, landmarks, ts };
        notifyDiagnostics(diag);

        // Evaluate all subscribers with extended logic
        const now = Date.now();
        subscribers.forEach((sub, id) => {
            const { gesture } = sub;
            const fired = evaluateGesture(gesture, blend, mat, landmarks, now, sub);
            if (fired) {
                try { sub.callback(); } catch (e) {}
                sub.lastTrigger = now;
            }
        });
    }

    function indexBlendshapes(faceBlendshapes) {
        const map = {};
        if (!faceBlendshapes || !faceBlendshapes.categories) return map;
        for (const c of faceBlendshapes.categories) {
            map[c.categoryName] = c.score;
        }
        return map;
    }

    function evaluateGesture(gesture, blend, mat, landmarks, now, sub) {
        // Respect debounce
        const dwell = gesture.dwellMs ?? 150;
        const debounce = gesture.debounceMs ?? 400;
        if (now - (sub.lastTrigger || 0) < debounce) return false;

        // Smoothed helpers
        sub._smooth = sub._smooth || {};
        function smooth(key, val, alpha) {
            if (val === undefined) return 0;
            const a = alpha ?? 0.5;
            const prev = sub._smooth[key] ?? val;
            const out = a * val + (1 - a) * prev;
            sub._smooth[key] = out;
            return out;
        }

        const sAlpha = gesture.smoothingAlpha ?? 0.5;

        function dwellCheck(cond) {
            if (cond) {
                if (!sub.dwellStart) sub.dwellStart = now;
                return now - sub.dwellStart >= dwell;
            }
            sub.dwellStart = 0;
            return false;
        }

        // Blink gestures
        if (gesture.type === 'BLINK_BOTH' || gesture.type === 'BLINK_LEFT' || gesture.type === 'BLINK_RIGHT') {
            const th = gesture.blinkScoreThreshold ?? 0.5;
            const l = smooth('blinkL', blend['eyeBlinkLeft'] || 0, sAlpha);
            const r = smooth('blinkR', blend['eyeBlinkRight'] || 0, sAlpha);
            if (gesture.type === 'BLINK_BOTH') {
                return dwellCheck(l > th && r > th);
            }
            if (gesture.type === 'BLINK_LEFT') return dwellCheck(l > th);
            if (gesture.type === 'BLINK_RIGHT') return dwellCheck(r > th);
        }

        // Eye look
        if (gesture.type && gesture.type.startsWith('EYES_')) {
            const th = gesture.gazeScoreThreshold ?? 0.5;
            const left = smooth('lookL', blend['eyeLookLeft'] || 0, sAlpha);
            const right = smooth('lookR', blend['eyeLookRight'] || 0, sAlpha);
            const up = smooth('lookU', blend['eyeLookUp'] || 0, sAlpha);
            const down = smooth('lookD', blend['eyeLookDown'] || 0, sAlpha);
            if (gesture.type === 'EYES_LEFT') return dwellCheck(left > th && left > right);
            if (gesture.type === 'EYES_RIGHT') return dwellCheck(right > th && right > left);
            if (gesture.type === 'EYES_UP') return dwellCheck(up > th && up > down);
            if (gesture.type === 'EYES_DOWN') return dwellCheck(down > th && down > up);
        }

        // Head tilt (roll angle)
        if (gesture.type && gesture.type.startsWith('HEAD_TILT')) {
            const degTh = gesture.headTiltDegThreshold ?? 15;
            const rollDeg = getRollDegFromMatrix(mat);
            if (rollDeg == null) return false;
            if (gesture.type === 'HEAD_TILT_LEFT') return dwellCheck(rollDeg < -degTh);
            if (gesture.type === 'HEAD_TILT_RIGHT') return dwellCheck(rollDeg > degTh);
        }

        // Head movement (center offset)
        if (gesture.type && gesture.type.startsWith('HEAD_') && !gesture.type.startsWith('HEAD_TILT')) {
            sub._neutral = sub._neutral || estimateFaceBox(landmarks);
            const face = estimateFaceBox(landmarks);
            if (!face || !sub._neutral) return false;
            const dx = (face.cx - sub._neutral.cx) / face.w;
            const dy = (face.cy - sub._neutral.cy) / face.h;
            const th = gesture.headMoveNormThreshold ?? 0.15;
            if (gesture.type === 'HEAD_LEFT') return dwellCheck(dx < -th);
            if (gesture.type === 'HEAD_RIGHT') return dwellCheck(dx > th);
            if (gesture.type === 'HEAD_UP') return dwellCheck(dy < -th);
            if (gesture.type === 'HEAD_DOWN') return dwellCheck(dy > th);
        }

        // Expression gestures via blendshapes
        const thG = gesture.gazeScoreThreshold ?? 0.5;
        switch (gesture.type) {
            case 'BROW_RAISE':
                return dwellCheck(smooth('brow', (blend['browInnerUp'] || 0), sAlpha) > thG);
            case 'CHEEK_PUFF':
                return dwellCheck(smooth('cheek', (blend['cheekPuff'] || 0), sAlpha) > thG);
            case 'TONGUE_OUT':
                return dwellCheck(smooth('tongue', (blend['tongueOut'] || 0), sAlpha) > thG);
            case 'SMILE':
                return dwellCheck(smooth('smile', avg(blend['mouthSmileLeft'], blend['mouthSmileRight']), sAlpha) > thG);
            case 'FROWN':
                return dwellCheck(smooth('frown', avg(blend['mouthFrownLeft'], blend['mouthFrownRight']), sAlpha) > thG);
            case 'JAW_OPEN':
                return dwellCheck(smooth('jaw', (blend['jawOpen'] || 0), sAlpha) > thG);
        }

        return false;
    }

    function avg(a, b) { return ((a||0) + (b||0)) / 2; }

    function getRollDegFromMatrix(mat) {
        try {
            if (!mat || !mat.data) return null;
            // mat is 4x4; roll can be approximated from rotation part; use atan2(m10, m00)
            const m = mat.data;
            const m00 = m[0], m10 = m[4];
            const roll = Math.atan2(m10, m00) * 180 / Math.PI;
            return roll;
        } catch (e) { return null; }
    }

    function estimateFaceBox(landmarks) {
        if (!landmarks || landmarks.length === 0) return null;
        let minX = 1, minY = 1, maxX = 0, maxY = 0;
        for (const p of landmarks) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        const w = Math.max(0.001, maxX - minX);
        const h = Math.max(0.001, maxY - minY);
        return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, w, h };
    }

    return {
        start,
        stop,
        subscribe,
        subscribeDiagnostics,
        getState: () => state,
        getError: () => error
    };
})();

export { facelandmarkerService };

