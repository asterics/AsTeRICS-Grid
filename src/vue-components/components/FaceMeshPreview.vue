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
        case 'HEAD_TILT_LEFT': return -(this.rollDeg() || 0);
        case 'HEAD_TILT_RIGHT': return (this.rollDeg() || 0);
        case 'HEAD_LEFT': return -this.headMoveX();
        case 'HEAD_RIGHT': return this.headMoveX();
        case 'HEAD_UP': return -this.headMoveY();
        case 'HEAD_DOWN': return this.headMoveY();
        case 'BROW_RAISE': return b.browInnerUp || 0;
        case 'CHEEK_PUFF': return b.cheekPuff || 0;
        case 'TONGUE_OUT': return b.tongueOut || 0;
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
      const mat = this.diag && this.diag.mat;
      try {
        if (!mat || !mat.data) return 0;
        const m = mat.data; const m00 = m[0], m10 = m[4];
        return Math.atan2(m10, m00) * 180 / Math.PI;
      } catch(e){ return 0; }
    },
    headMoveX() {
      const fb = this.faceBox();
      if (!fb || !this._neutral) { this._neutral = fb; return 0; }
      return (fb.cx - this._neutral.cx) / fb.w;
    },
    headMoveY() {
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

