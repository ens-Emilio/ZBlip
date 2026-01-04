<template>
  <div class="waveform-timeline">
    <canvas ref="waveformCanvas" class="waveform-canvas" @click="handleTimelineClick"></canvas>
    <div class="playback-cursor" :style="{ left: cursorPosition + '%' }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { WaveformVisualizer } from '../utils/waveformVisualizer';

const props = defineProps<{
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  totalDuration: number;
}>();

const emit = defineEmits<{
  (e: 'seek', time: number): void;
}>();

const waveformCanvas = ref<HTMLCanvasElement | null>(null);
const visualizer = ref<WaveformVisualizer | null>(null);

const cursorPosition = computed(() => {
  if (!props.totalDuration) return 0;
  return (props.currentTime / props.totalDuration) * 100;
});

onMounted(() => drawWaveform());

watch(
  () => props.audioBuffer,
  () => drawWaveform(),
);

watch(
  () => props.currentTime,
  () => drawWaveform(true),
);

function drawWaveform(skipRepaint = false) {
  if (!waveformCanvas.value || !props.audioBuffer) return;
  if (!visualizer.value || !skipRepaint) {
    visualizer.value = new WaveformVisualizer(waveformCanvas.value, {
      strokeColor: '#5aa0ff',
      progressColor: '#ff7f50',
      backgroundColor: '#0c1322',
      barWidth: 2,
      padding: 8,
    });
  }

  if (!visualizer.value) return;
  const data = extractWaveformData(props.audioBuffer);
  const progress = props.totalDuration ? props.currentTime / props.totalDuration : 0;
  visualizer.value.draw(data, progress);
}

function extractWaveformData(buffer: AudioBuffer): number[] {
  const rawData = buffer.getChannelData(0);
  const samples = 400;
  const blockSize = Math.max(1, Math.floor(rawData.length / samples));
  const filtered: number[] = [];

  for (let i = 0; i < samples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      sum += Math.abs(rawData[i * blockSize + j] || 0);
    }
    filtered.push(sum / blockSize);
  }
  return filtered;
}

function handleTimelineClick(e: MouseEvent) {
  const rect = waveformCanvas.value?.getBoundingClientRect();
  if (!rect || !props.totalDuration) return;
  const clickX = e.clientX - rect.left;
  const percent = clickX / rect.width;
  const newTime = percent * props.totalDuration;
  emit('seek', newTime);
}
</script>

<style scoped>
.waveform-timeline {
  position: relative;
  width: 100%;
  height: 160px;
  background: #0c1322;
  border: 1px solid #1f2940;
  border-radius: 10px;
  overflow: hidden;
}

.waveform-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.playback-cursor {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #ff7f50;
  pointer-events: none;
}
</style>
