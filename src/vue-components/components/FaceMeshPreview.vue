<template>
  <div class="facemesh-preview">
    <div class="graph-wrap">
      <canvas ref="graph" class="graph"></canvas>
    </div>
    <div class="metrics" v-if="diag && diag.ok">
      <div><b>{{ gestureLabel }}</b>: {{ fmt(currentValue) }} &nbsp; • {{$t('threshold')}}: {{ fmt(currentThreshold) }}</div>
    </div>
    <div class="metrics" v-else>
      <div>{{$t('noFaceDetected')}}</div>
    </div>
  </div>
</template>

<script>
import { facelandmarkerService } from '../../js/service/facelandmarkerService';

export default {
  name: 'FaceMeshPreview',
  props: {
    gesture: { type: Object, required: true }
  },
  data() {
    return {
      unsubDiag: null,
      diag: null,
      blend: {},
      points: [],
      maxPoints: 120, // ~2s at 60fps
      lastTs: 0
    };
  },
  computed: {
    gestureType() { return this.gesture.gestureType || this.gesture.type; },
    gestureLabel() { return this.gestureType; },
    currentThreshold() {
      const g = this.gesture;
      if (!g) return 0.5;
      if (this.gestureType && this.gestureType.startsWith('BLINK')) return g.blinkScoreThreshold;
      if (this.gestureType && this.gestureType.startsWith('EYES_')) return g.gazeScoreThreshold;
      if (this.gestureType && this.gestureType.startsWith('HEAD_TILT')) return g.headTiltDegThreshold;
      if (this.gestureType && this.gestureType.startsWith('HEAD_')) return g.headMoveNormThreshold;
      return g.gazeScoreThreshold ?? 0.5;
    },
    currentValue() {
      if (!this.diag || !this.diag.ok) return 0;
      const b = this.blend;
      switch (this.gestureType) {
        case 'BLINK_LEFT': return b.eyeBlinkLeft || 0;
        case 'BLINK_RIGHT': return b.eyeBlinkRight || 0;
        case 'BLINK_BOTH': return Math.min((b.eyeBlinkLeft||0), (b.eyeBlinkRight||0));
        case 'EYES_LEFT': return (b.eyeLookLeft||0) - (b.eyeLookRight||0);
        case 'EYES_RIGHT': return (b.eyeLookRight||0) - (b.eyeLookLeft||0);
        case 'EYES_UP': return (b.eyeLookUp||0) - (b.eyeLookDown||0);
        case 'EYES_DOWN': return (b.eyeLookDown||0) - (b.eyeLookUp||0);
        case 'HEAD_TILT_LEFT': return (this.rollDeg() || 0);  // Flipped to match user perspective
        case 'HEAD_TILT_RIGHT': return -(this.rollDeg() || 0); // Flipped to match user perspective
        case 'HEAD_LEFT': return this.headMoveX();   // Flipped to match user perspective
        case 'HEAD_RIGHT': return -this.headMoveX(); // Flipped to match user perspective
        case 'HEAD_UP': return -this.headMoveY();
        case 'HEAD_DOWN': return this.headMoveY();
        case 'BROW_RAISE': return b.browInnerUp || 0;
        case 'CHEEK_PUFF': return b.cheekPuff || 0;
        case 'TONGUE_OUT':
          // MediaPipe doesn't provide tongueOut blendshape, estimate from mouth shapes
          const jawOpen = b.jawOpen || 0;
          const mouthFunnel = b.mouthFunnel || 0;
          const mouthPucker = b.mouthPucker || 0;
          const mouthRollLower = b.mouthRollLower || 0;
          const mouthShrugLower = b.mouthShrugLower || 0;

          // Combine components (same logic as service)
          const jawComponent = Math.min(jawOpen * 0.7, 0.35);
          const funnelComponent = mouthFunnel * 0.5;
          const puckerComponent = mouthPucker * 0.4;
          const rollComponent = mouthRollLower * 0.6;
          const shrugComponent = mouthShrugLower * 0.3;

          return Math.max(0, jawComponent + Math.max(funnelComponent, puckerComponent) + rollComponent + shrugComponent - 0.12);
        case 'SMILE': return ((b.mouthSmileLeft||0) + (b.mouthSmileRight||0))/2;
        case 'FROWN': return ((b.mouthFrownLeft||0) + (b.mouthFrownRight||0))/2;
        case 'JAW_OPEN': return b.jawOpen || 0;
        default: return 0;
      }
    }
  },
  watch: {
    gesture: { handler() { this.points = []; }, deep: true }
  },
  methods: {
    fmt(v) {
      if (v === undefined) return '-';
      return (Math.round(v * 100) / 100).toFixed(2);
    },
    rollDeg() {
      // Try landmark-based calculation first (more reliable)
      const landmarks = this.diag && this.diag.landmarks;
      if (landmarks && landmarks.length >= 468) {
        try {
          const leftEyeOuter = landmarks[33];   // Left eye outer corner
          const rightEyeOuter = landmarks[263]; // Right eye outer corner

          // Calculate roll angle from eye line
          const roll = Math.atan2(rightEyeOuter.y - leftEyeOuter.y, rightEyeOuter.x - leftEyeOuter.x) * 180 / Math.PI;
          return roll;
        } catch(e) {
          console.warn('Landmark-based roll calculation failed:', e);
        }
      }

      // Fallback to matrix-based calculation
      const mat = this.diag && this.diag.mat;
      try {
        if (!mat) return 0;

        // Handle different matrix formats
        let matrixData;
        if (Array.isArray(mat)) {
          matrixData = mat;
        } else if (mat.data && Array.isArray(mat.data)) {
          matrixData = mat.data;
        } else {
          return 0;
        }

        if (matrixData.length < 16) return 0;

        // MediaPipe uses column-major format
        const m00 = matrixData[0], m10 = matrixData[1];
        return Math.atan2(m10, m00) * 180 / Math.PI;
      } catch(e){
        console.warn('Matrix-based roll calculation failed:', e);
        return 0;
      }
    },
    headMoveX() {
      // Try landmark-based yaw calculation first
      const landmarks = this.diag && this.diag.landmarks;
      if (landmarks && landmarks.length >= 468) {
        try {
          const noseTip = landmarks[1];         // Nose tip
          const leftFace = landmarks[234];      // Left face edge
          const rightFace = landmarks[454];     // Right face edge

          const faceCenter = (leftFace.x + rightFace.x) / 2;
          const faceWidth = Math.abs(rightFace.x - leftFace.x);
          const noseOffset = (noseTip.x - faceCenter) / faceWidth;

          return noseOffset; // Positive = right, negative = left
        } catch(e) {
          console.warn('Landmark-based yaw calculation failed:', e);
        }
      }

      // Fallback to face box method
      const fb = this.faceBox();
      if (!fb || !this._neutral) { this._neutral = fb; return 0; }
      return (fb.cx - this._neutral.cx) / fb.w;
    },
    headMoveY() {
      // Try landmark-based pitch calculation first
      const landmarks = this.diag && this.diag.landmarks;
      if (landmarks && landmarks.length >= 468) {
        try {
          const leftEyeOuter = landmarks[33];   // Left eye outer corner
          const rightEyeOuter = landmarks[263]; // Right eye outer corner
          const noseTip = landmarks[1];         // Nose tip
          const forehead = landmarks[10];       // Forehead center
          const chin = landmarks[152];          // Chin bottom

          const faceHeight = Math.abs(forehead.y - chin.y);
          const eyeLevel = (leftEyeOuter.y + rightEyeOuter.y) / 2;
          const noseToEyeRatio = (noseTip.y - eyeLevel) / faceHeight;

          // Normalize around baseline (from testing)
          const neutralBaseline = 0.22;
          const pitchRatio = (noseToEyeRatio - neutralBaseline) * 5; // Scale for display

          return pitchRatio; // Positive = down, negative = up
        } catch(e) {
          console.warn('Landmark-based pitch calculation failed:', e);
        }
      }

      // Fallback to face box method
      const fb = this.faceBox();
      if (!fb || !this._neutral) { this._neutral = fb; return 0; }
      return (fb.cy - this._neutral.cy) / fb.h;
    },
    faceBox() {
      const lms = (this.diag && this.diag.landmarks) || [];
      if (!lms.length) return null;
      let minX=1,minY=1,maxX=0,maxY=0;
      for (const p of lms) { if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y; if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y; }
      const w = Math.max(0.001, maxX-minX), h = Math.max(0.001, maxY-minY);
      return { cx:(minX+maxX)/2, cy:(minY+maxY)/2, w, h };
    },
    drawGraph() {
      const canvas = this.$refs.graph; if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width = canvas.offsetWidth || 480;
      const H = canvas.height = 160;
      ctx.clearRect(0,0,W,H);

      // Axes
      ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0,H-20); ctx.lineTo(W,H-20); ctx.stroke();

      // Threshold line
      const isDeg = this.gestureType && this.gestureType.startsWith('HEAD_TILT');
      const th = this.currentThreshold;
      const yTh = isDeg
        ? H-20 - (Math.max(-45, Math.min(45, th)) + 45) * (H-40) / 90
        : H-20 - Math.max(-1, Math.min(1, th)) * (H-40);
      ctx.strokeStyle = '#b00'; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0,yTh); ctx.lineTo(W,yTh); ctx.stroke();
      ctx.setLineDash([]);

      // Data line
      ctx.strokeStyle = '#0aa'; ctx.lineWidth = 2;
      ctx.beginPath();
      const n = this.points.length;
      for (let i=0;i<n;i++) {
        const x = i/(this.maxPoints-1) * W;
        const v = this.points[i];
        const y = isDeg
          ? H-20 - (Math.max(-45, Math.min(45, v)) + 45) * (H-40) / 90
          : H-20 - Math.max(-1, Math.min(1, v)) * (H-40);
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();

      // Trigger markers when crossing threshold
      ctx.fillStyle = 'rgba(0,170,0,0.25)';
      const last = this.points[n-1];
      if (last !== undefined) {
        const crossed = isDeg ? (last >= th) : (last >= th);
        if (crossed) {
          ctx.fillRect(W-20, 0, 20, H-20);
        }
      }
    }
  },
  async mounted() {
    try { await facelandmarkerService.start(); } catch(e) {}
    this.unsubDiag = facelandmarkerService.subscribeDiagnostics((payload) => {
      this.diag = payload; this.blend = (payload && payload.blend) || {};
      const now = performance.now();
      if (!this.lastTs || now - this.lastTs > 1000/60) this.lastTs = now;
      this.points.push(this.currentValue);
      if (this.points.length > this.maxPoints) this.points.shift();
      this.$nextTick(() => this.drawGraph());
    });
  },
  beforeDestroy() { if (this.unsubDiag) this.unsubDiag(); }
};
</script>

<style scoped>
.facemesh-preview { width: 100%; }
.graph-wrap { position: relative; width: 100%; max-width: 520px; }
.graph { width: 100%; height: 160px; display: block; }
.metrics { font-size: 0.9em; margin-top: 0.5em; }
</style>

