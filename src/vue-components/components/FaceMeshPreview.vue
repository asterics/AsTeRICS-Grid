<template>
  <div class="facemesh-preview">
    <div class="canvas-wrap">
      <video ref="video" class="hidden-video" playsinline muted autoplay></video>
      <canvas ref="canvas" class="overlay"></canvas>
    </div>
    <div class="metrics" v-if="diag && diag.ok">
      <div><b>eyeBlinkLeft</b>: {{ fmt(blend.eyeBlinkLeft) }} &nbsp; <b>eyeBlinkRight</b>: {{ fmt(blend.eyeBlinkRight) }}</div>
      <div><b>eyeLookL/R/U/D</b>: {{ fmt(blend.eyeLookLeft) }}, {{ fmt(blend.eyeLookRight) }}, {{ fmt(blend.eyeLookUp) }}, {{ fmt(blend.eyeLookDown) }}</div>
      <div><b>browInnerUp</b>: {{ fmt(blend.browInnerUp) }} &nbsp; <b>cheekPuff</b>: {{ fmt(blend.cheekPuff) }} &nbsp; <b>tongueOut</b>: {{ fmt(blend.tongueOut) }}</div>
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
  data() {
    return {
      unsubDiag: null,
      diag: null,
      blend: {}
    };
  },
  methods: {
    fmt(v) {
      if (v === undefined) return '-';
      return (Math.round(v * 100) / 100).toFixed(2);
    },
    drawOverlay() {
      const canvas = this.$refs.canvas;
      const video = this.$refs.video;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!this.diag || !this.diag.ok) return;
      const lms = this.diag.landmarks || [];
      ctx.strokeStyle = 'rgba(0,200,255,0.9)';
      ctx.lineWidth = 1;
      for (const pt of lms) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  },
  async mounted() {
    // Try to start the service and subscribe for diagnostics
    try {
      await facelandmarkerService.start();
    } catch (e) {
      // ignore here; parent UI should show error
    }
    this.unsubDiag = facelandmarkerService.subscribeDiagnostics((payload) => {
      this.diag = payload;
      this.blend = payload && payload.blend ? payload.blend : {};
      this.$nextTick(() => this.drawOverlay());
    });
  },
  beforeDestroy() {
    if (this.unsubDiag) this.unsubDiag();
  }
};
</script>

<style scoped>
.facemesh-preview { width: 100%; }
.canvas-wrap { position: relative; width: 100%; max-width: 480px; }
.overlay { position: absolute; top: 0; left: 0; width: 100%; height: auto; }
.hidden-video { position: absolute; opacity: 0; width: 0; height: 0; }
.metrics { font-size: 0.9em; margin-top: 0.5em; }
</style>

