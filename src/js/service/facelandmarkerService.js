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

    // Debug flags to log only once
    let debugFlags = {
        blendshapesLogged: false,
        headTiltLogged: false,
        headMoveLogged: false,
        headMoveFallbackLogged: false,
        tongueOutLogged: false,
        cheekPuffLogged: false,
        matrixLogged: false,
        fullResultLogged: false
    };

    // Candidate WASM roots (try in order). First entry matches our installed npm version.
    const CDN_WASM_CANDIDATES = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm',
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    ];
    // Model asset (.task) hosted by MediaPipe
    const MODEL_TASK_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

    async function getFileset() {
        let lastErr = null;
        for (const root of CDN_WASM_CANDIDATES) {
            try {
                // eslint-disable-next-line no-console
                console.info('[FaceLandmarker] Trying WASM root:', root);
                const fileset = await FilesetResolver.forVisionTasks(root);
                // eslint-disable-next-line no-console
                console.info('[FaceLandmarker] Loaded WASM files from:', root);
                return fileset;
            } catch (e) {
                lastErr = e;
                // eslint-disable-next-line no-console
                console.warn('[FaceLandmarker] Failed to load WASM from', root, e && e.message ? e.message : e);
            }
        }
        throw lastErr || new Error('Failed to load MediaPipe WASM fileset');
    }

    async function ensureInitialized() {
        if (landmarker) return;
        state = 'initializing';
        try {
            const fileset = await getFileset();
            // Try GPU first, then gracefully fall back to CPU
            try {
                landmarker = await FaceLandmarker.createFromOptions(fileset, {
                    baseOptions: {
                        modelAssetPath: MODEL_TASK_URL,
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numFaces: 1,
                    minFaceDetectionConfidence: 0.3,  // Lower threshold for better detection
                    minFacePresenceConfidence: 0.3,   // Lower threshold for better detection
                    minTrackingConfidence: 0.3,       // Lower threshold for better detection
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

        // Debug matrix data once
        if (!debugFlags.matrixLogged && mat) {
            console.log('Matrix data received:', mat);
            debugFlags.matrixLogged = true;
        }

        // Debug: Full result dump once (for API verification)
        if (!debugFlags.fullResultLogged) {
            console.log('=== FULL MEDIAPIPE RESULT DUMP ===');
            console.log('Raw result object:', result);
            console.log('Face landmarks count:', result.faceLandmarks?.length || 0);
            console.log('Face blendshapes count:', result.faceBlendshapes?.length || 0);
            console.log('Transformation matrices count:', result.facialTransformationMatrixes?.length || 0);

            if (result.faceBlendshapes && result.faceBlendshapes[0]) {
                console.log('First face blendshapes structure:', result.faceBlendshapes[0]);
                console.log('Blendshapes categories count:', result.faceBlendshapes[0].categories?.length || 0);
                if (result.faceBlendshapes[0].categories) {
                    console.log('First 10 blendshape categories:', result.faceBlendshapes[0].categories.slice(0, 10));
                }
            }

            if (result.facialTransformationMatrixes && result.facialTransformationMatrixes[0]) {
                console.log('First transformation matrix:', result.facialTransformationMatrixes[0]);
                console.log('Matrix type:', typeof result.facialTransformationMatrixes[0]);
                console.log('Matrix length:', result.facialTransformationMatrixes[0].length);
                console.log('Matrix data:', result.facialTransformationMatrixes[0]);
            }

            console.log('=== END RESULT DUMP ===');
            debugFlags.fullResultLogged = true;
        }

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

        // Debug: Log available blendshapes once
        if (!debugFlags.blendshapesLogged && Object.keys(map).length > 0) {
            console.log('Available MediaPipe blendshapes:', Object.keys(map));
            debugFlags.blendshapesLogged = true;
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
        const gType = gesture.type || gesture.gestureType;

        function dwellCheck(cond) {
            if (cond) {
                if (!sub.dwellStart) sub.dwellStart = now;
                return now - sub.dwellStart >= dwell;
            }
            sub.dwellStart = 0;
            return false;
        }

        // Blink gestures
        if (gType === 'BLINK_BOTH' || gType === 'BLINK_LEFT' || gType === 'BLINK_RIGHT') {
            const th = gesture.blinkScoreThreshold ?? 0.5;
            const l = smooth('blinkL', blend['eyeBlinkLeft'] || 0, sAlpha);
            const r = smooth('blinkR', blend['eyeBlinkRight'] || 0, sAlpha);
            if (gType === 'BLINK_BOTH') {
                return dwellCheck(l > th && r > th);
            }
            if (gType === 'BLINK_LEFT') return dwellCheck(l > th);
            if (gType === 'BLINK_RIGHT') return dwellCheck(r > th);
        }

        // Eye look
        if (gType && gType.startsWith('EYES_')) {
            const th = gesture.gazeScoreThreshold ?? 0.5;
            const left = smooth('lookL', blend['eyeLookLeft'] || 0, sAlpha);
            const right = smooth('lookR', blend['eyeLookRight'] || 0, sAlpha);
            const up = smooth('lookU', blend['eyeLookUp'] || 0, sAlpha);
            const down = smooth('lookD', blend['eyeLookDown'] || 0, sAlpha);
            if (gType === 'EYES_LEFT') return dwellCheck(left > th && left > right);
            if (gType === 'EYES_RIGHT') return dwellCheck(right > th && right > left);
            if (gType === 'EYES_UP') return dwellCheck(up > th && up > down);
            if (gType === 'EYES_DOWN') return dwellCheck(down > th && down > up);
        }

        // Head tilt (roll angle) - use landmarks first, matrix as fallback
        if (gType && gType.startsWith('HEAD_TILT')) {
            const degTh = gesture.headTiltDegThreshold ?? 15;

            // Try landmark-based calculation first
            const landmarkPose = getHeadPoseFromLandmarks(landmarks);
            let rollDeg = null;

            if (landmarkPose) {
                rollDeg = landmarkPose.roll;
            } else {
                // Fallback to matrix-based calculation
                rollDeg = getRollDegFromMatrix(mat);
            }

            // Debug head tilt once
            if (!debugFlags.headTiltLogged) {
                console.log(`HEAD_TILT debug - gType: ${gType}, rollDeg: ${rollDeg}, threshold: ${degTh}, method: ${landmarkPose ? 'landmarks' : 'matrix'}`);
                debugFlags.headTiltLogged = true;
            }

            if (rollDeg == null) return false;
            // Flip the roll direction to match user's perspective (mirror image)
            if (gType === 'HEAD_TILT_LEFT') return dwellCheck(rollDeg > degTh);
            if (gType === 'HEAD_TILT_RIGHT') return dwellCheck(rollDeg < -degTh);
        }

        // Head movement (using landmark-based head pose with matrix fallback)
        if (gType && gType.startsWith('HEAD_') && !gType.startsWith('HEAD_TILT')) {
            // Try landmark-based calculation first
            const landmarkPose = getHeadPoseFromLandmarks(landmarks);

            if (landmarkPose) {
                // Use landmark-based head pose for more accurate detection
                const pitchThreshold = gesture.headMoveNormThreshold ? gesture.headMoveNormThreshold * 100 : 15;
                const yawNormThreshold = gesture.headMoveNormThreshold ?? 0.15; // Use normalized ratio for yaw

                // Debug head movement once
                if (!debugFlags.headMoveLogged) {
                    console.log(`HEAD_MOVE debug - gType: ${gType}, yaw: ${landmarkPose.yaw.toFixed(1)}°, pitch: ${landmarkPose.pitch.toFixed(1)}°, noseOffset: ${landmarkPose.noseOffset.toFixed(3)}, thresholds: pitch±${pitchThreshold}°, yaw±${yawNormThreshold}`);
                    debugFlags.headMoveLogged = true;
                }

                // Flip directions to match user's perspective (mirror image)
                if (gType === 'HEAD_LEFT') return dwellCheck(landmarkPose.noseOffset > yawNormThreshold);
                if (gType === 'HEAD_RIGHT') return dwellCheck(landmarkPose.noseOffset < -yawNormThreshold);
                if (gType === 'HEAD_UP') return dwellCheck(landmarkPose.pitch < -pitchThreshold);
                if (gType === 'HEAD_DOWN') return dwellCheck(landmarkPose.pitch > pitchThreshold);
            } else {
                // Fallback to matrix-based detection
                const headPose = getHeadPoseFromMatrix(mat);
                if (headPose) {
                    const yawThreshold = gesture.headMoveNormThreshold ? gesture.headMoveNormThreshold * 100 : 15;
                    const pitchThreshold = gesture.headMoveNormThreshold ? gesture.headMoveNormThreshold * 100 : 15;

                    // Flip directions to match user's perspective (mirror image)
                    if (gType === 'HEAD_LEFT') return dwellCheck(headPose.yaw > yawThreshold);
                    if (gType === 'HEAD_RIGHT') return dwellCheck(headPose.yaw < -yawThreshold);
                    if (gType === 'HEAD_UP') return dwellCheck(headPose.pitch > pitchThreshold);
                    if (gType === 'HEAD_DOWN') return dwellCheck(headPose.pitch < -pitchThreshold);
                } else {
                    // Final fallback to face box detection
                    sub._neutral = sub._neutral || estimateFaceBox(landmarks);
                    const face = estimateFaceBox(landmarks);
                    if (!face || !sub._neutral) return false;
                    const dx = (face.cx - sub._neutral.cx) / face.w;
                    const dy = (face.cy - sub._neutral.cy) / face.h;
                    const th = gesture.headMoveNormThreshold ?? 0.15;

                    // Debug fallback once
                    if (!debugFlags.headMoveFallbackLogged) {
                        console.log(`HEAD_MOVE fallback - gType: ${gType}, dx: ${dx.toFixed(3)}, dy: ${dy.toFixed(3)}, threshold: ${th}`);
                        debugFlags.headMoveFallbackLogged = true;
                    }

                    if (gType === 'HEAD_LEFT') return dwellCheck(dx < -th);
                    if (gType === 'HEAD_RIGHT') return dwellCheck(dx > th);
                    if (gType === 'HEAD_UP') return dwellCheck(dy < -th);
                    if (gType === 'HEAD_DOWN') return dwellCheck(dy > th);
                }
            }
        }

        // Expression gestures via blendshapes
        const thG = gesture.gazeScoreThreshold ?? 0.5;

        // Helper function to get blendshape value with fallback names
        function getBlendshapeValue(primaryName, fallbackNames = []) {
            if (blend[primaryName] !== undefined) return blend[primaryName];
            for (const fallback of fallbackNames) {
                if (blend[fallback] !== undefined) return blend[fallback];
            }
            return 0;
        }

        switch (gType) {
            case 'BROW_RAISE':
                return dwellCheck(smooth('brow', getBlendshapeValue('browInnerUp', ['browInnerUp']), sAlpha) > thG);
            case 'CHEEK_PUFF':
                // MediaPipe's cheekPuff blendshape often returns 0, use enhanced detection
                const cheekPuffValue = getBlendshapeValue('cheekPuff', ['cheekPuff']);
                const cheekSquintL = getBlendshapeValue('cheekSquintLeft', ['cheekSquintLeft']);
                const cheekSquintR = getBlendshapeValue('cheekSquintRight', ['cheekSquintRight']);
                const mouthPuckerCheek = getBlendshapeValue('mouthPucker', ['mouthPucker']);

                // Combine multiple indicators for cheek puff detection
                // Use cheek squinting as primary alternative since cheekPuff often fails
                const cheekSquintAvg = (cheekSquintL + cheekSquintR) / 2;
                const cheekEstimate = Math.max(
                    cheekPuffValue,  // Use direct value if available
                    cheekSquintAvg + mouthPuckerCheek * 0.3  // Alternative: squinting + mouth pucker
                );

                const smoothedCheek = smooth('cheek', cheekEstimate, sAlpha);

                // Debug cheek puff once
                if (!debugFlags.cheekPuffLogged) {
                    console.log(`CHEEK_PUFF debug - cheekPuff: ${cheekPuffValue.toFixed(3)}, squintL: ${cheekSquintL.toFixed(3)}, squintR: ${cheekSquintR.toFixed(3)}, pucker: ${mouthPuckerCheek.toFixed(3)}`);
                    console.log(`CHEEK_PUFF estimate - squintAvg: ${cheekSquintAvg.toFixed(3)}, final: ${cheekEstimate.toFixed(3)}, smoothed: ${smoothedCheek.toFixed(3)}, threshold: ${thG}`);
                    debugFlags.cheekPuffLogged = true;
                }

                return dwellCheck(smoothedCheek > thG);
            case 'TONGUE_OUT':
                // MediaPipe's face landmarker model doesn't include tongueOut blendshape
                // Use alternative detection method based on mouth and jaw movements
                const jawOpen = getBlendshapeValue('jawOpen', ['jawOpen']);
                const mouthFunnel = getBlendshapeValue('mouthFunnel', ['mouthFunnel']);
                const mouthPucker = getBlendshapeValue('mouthPucker', ['mouthPucker']);
                const mouthRollLower = getBlendshapeValue('mouthRollLower', ['mouthRollLower']);
                const mouthShrugLower = getBlendshapeValue('mouthShrugLower', ['mouthShrugLower']);

                // Improved tongue out estimation using multiple mouth shape indicators
                // Tongue out typically involves: moderate jaw opening + specific mouth shapes
                const jawComponent = Math.min(jawOpen * 0.7, 0.35); // Moderate jaw opening
                const funnelComponent = mouthFunnel * 0.5; // Mouth funnel shape
                const puckerComponent = mouthPucker * 0.4; // Mouth pucker
                const rollComponent = mouthRollLower * 0.6; // Lower lip roll (common with tongue out)
                const shrugComponent = mouthShrugLower * 0.3; // Lower lip movement

                // Combine components with threshold adjustment
                const tongueEstimate = Math.max(0,
                    jawComponent +
                    Math.max(funnelComponent, puckerComponent) +
                    rollComponent +
                    shrugComponent - 0.12
                );
                const smoothedTongue = smooth('tongue', tongueEstimate, sAlpha);

                // Debug tongue out once
                if (!debugFlags.tongueOutLogged) {
                    console.log(`TONGUE_OUT debug - jaw: ${jawOpen.toFixed(3)}, funnel: ${mouthFunnel.toFixed(3)}, pucker: ${mouthPucker.toFixed(3)}, roll: ${mouthRollLower.toFixed(3)}, shrug: ${mouthShrugLower.toFixed(3)}`);
                    console.log(`TONGUE_OUT components - jaw: ${jawComponent.toFixed(3)}, funnel: ${funnelComponent.toFixed(3)}, pucker: ${puckerComponent.toFixed(3)}, roll: ${rollComponent.toFixed(3)}, estimate: ${tongueEstimate.toFixed(3)}, smoothed: ${smoothedTongue.toFixed(3)}, threshold: ${thG}`);
                    debugFlags.tongueOutLogged = true;
                }

                return dwellCheck(smoothedTongue > thG);
            case 'SMILE':
                return dwellCheck(smooth('smile', avg(getBlendshapeValue('mouthSmileLeft'), getBlendshapeValue('mouthSmileRight')), sAlpha) > thG);
            case 'FROWN':
                return dwellCheck(smooth('frown', avg(getBlendshapeValue('mouthFrownLeft'), getBlendshapeValue('mouthFrownRight')), sAlpha) > thG);
            case 'JAW_OPEN':
                return dwellCheck(smooth('jaw', getBlendshapeValue('jawOpen', ['jawOpen']), sAlpha) > thG);
        }

        return false;
    }

    function avg(a, b) { return ((a||0) + (b||0)) / 2; }

    function getHeadPoseFromLandmarks(landmarks) {
        try {
            if (!landmarks || landmarks.length < 468) return null;

            // MediaPipe 468 face landmarks - key points:
            const leftEyeOuter = landmarks[33];   // Left eye outer corner
            const rightEyeOuter = landmarks[263]; // Right eye outer corner
            const noseTip = landmarks[1];         // Nose tip
            const forehead = landmarks[10];       // Forehead center
            const chin = landmarks[152];          // Chin bottom
            const leftFace = landmarks[234];      // Left face edge
            const rightFace = landmarks[454];     // Right face edge

            // Helper function for angle calculation
            const radians = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);

            // ROLL: Face lean left/right (eye line angle)
            const roll = radians(leftEyeOuter.x, leftEyeOuter.y, rightEyeOuter.x, rightEyeOuter.y) * 180 / Math.PI;

            // YAW: Face turn left/right (nose position relative to face center)
            const faceCenter = (leftFace.x + rightFace.x) / 2;
            const faceWidth = Math.abs(rightFace.x - leftFace.x);
            const noseOffset = (noseTip.x - faceCenter) / faceWidth;
            const yaw = noseOffset * 90; // Convert to degrees

            // PITCH: Face up/down (nose position relative to eye level)
            const faceHeight = Math.abs(forehead.y - chin.y);
            const eyeLevel = (leftEyeOuter.y + rightEyeOuter.y) / 2;
            const noseToEyeRatio = (noseTip.y - eyeLevel) / faceHeight;
            const neutralBaseline = 0.22; // Baseline from testing
            const pitch = (noseToEyeRatio - neutralBaseline) * 200;

            return { roll, pitch, yaw, noseOffset };
        } catch (e) {
            console.warn('Error calculating head pose from landmarks:', e);
            return null;
        }
    }

    function getHeadPoseFromMatrix(mat) {
        try {
            // MediaPipe provides transformation matrix as flat column-major float array
            // For a 4x4 matrix in column-major format:
            // [m00, m10, m20, m30, m01, m11, m21, m31, m02, m12, m22, m32, m03, m13, m23, m33]

            let matrixData;
            if (mat && Array.isArray(mat)) {
                matrixData = mat;
            } else if (mat && mat.data && Array.isArray(mat.data)) {
                matrixData = mat.data;
            } else if (mat && typeof mat === 'object') {
                matrixData = mat.values || mat.array || mat.elements || Object.values(mat);
            } else {
                return null;
            }

            if (!matrixData || matrixData.length < 16) return null;

            // Extract rotation matrix components from column-major 4x4 matrix
            const m00 = matrixData[0];   // R11
            const m10 = matrixData[1];   // R21
            const m20 = matrixData[2];   // R31
            const m01 = matrixData[4];   // R12
            const m11 = matrixData[5];   // R22
            const m21 = matrixData[6];   // R32
            const m02 = matrixData[8];   // R13
            const m12 = matrixData[9];   // R23
            const m22 = matrixData[10];  // R33

            // Calculate Euler angles (in degrees)
            // Roll (Z-axis rotation): atan2(R21, R11)
            const roll = Math.atan2(m10, m00) * 180 / Math.PI;

            // Pitch (X-axis rotation): atan2(-R31, sqrt(R32^2 + R33^2))
            const pitch = Math.atan2(-m20, Math.sqrt(m21 * m21 + m22 * m22)) * 180 / Math.PI;

            // Yaw (Y-axis rotation): atan2(R12, R22)
            const yaw = Math.atan2(m01, m11) * 180 / Math.PI;

            return { roll, pitch, yaw };
        } catch (e) {
            console.warn('Error parsing transformation matrix:', e, mat);
            return null;
        }
    }

    // Legacy function for backward compatibility
    function getRollDegFromMatrix(mat) {
        const pose = getHeadPoseFromMatrix(mat);
        return pose ? pose.roll : null;
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
        getError: () => error,
        // Debug helper - can be called from console
        debugReset: () => {
            debugFlags = {
                blendshapesLogged: false,
                headTiltLogged: false,
                headMoveLogged: false,
                headMoveFallbackLogged: false,
                tongueOutLogged: false,
                cheekPuffLogged: false,
                matrixLogged: false,
                fullResultLogged: false
            };
            console.log('Debug flags reset - will log again on next detection');
        }
    };
})();

export { facelandmarkerService };

// Make debug helper available globally for console testing
if (typeof window !== 'undefined') {
    window.facelandmarkerDebug = facelandmarkerService.debugReset;
}

