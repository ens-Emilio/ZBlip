<template>
  <div class="player">
    <div class="subtitle">{{ currentSubtitle }}</div>

    <div class="player__controls">
      <button class="btn ghost" @click="$emit('play')">▶ Play</button>
      <button class="btn ghost" @click="$emit('pause')">⏸ Pause</button>
      <button class="btn ghost" @click="$emit('stop')">⏹ Stop</button>
    </div>

    <div class="playback-speed">
      <label>Velocidade: {{ playbackRate.toFixed(2) }}x</label>
      <input
        type="range"
        min="0.25"
        max="2"
        step="0.05"
        :value="playbackRate"
        @input="onRateChange"
      />
      <div class="speed-presets">
        <button class="btn ghost" @click="setRate(0.75)">0.75x</button>
        <button class="btn ghost" @click="setRate(1)">1x</button>
        <button class="btn ghost" @click="setRate(1.25)">1.25x</button>
        <button class="btn ghost" @click="setRate(1.5)">1.5x</button>
      </div>
    </div>

    <div class="timeline">
      <input
        type="range"
        min="0"
        :max="totalDuration || 0"
        :value="currentTime"
        @input="onSeek"
      />
      <div class="timeline__meta">
        <span>{{ formatMs(currentTime) }}</span>
        <span>{{ formatMs(totalDuration) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatMs } from '../utils/timeFormatter';

defineProps<{
  currentSubtitle: string;
  currentTime: number;
  totalDuration: number;
  playbackRate: number;
}>();

const emit = defineEmits<{
  (e: 'seek', value: number): void;
  (e: 'play'): void;
  (e: 'pause'): void;
  (e: 'stop'): void;
  (e: 'rate', value: number): void;
}>();

const onSeek = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('seek', Number(target.value));
};

const onRateChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('rate', Number(target.value));
};

const setRate = (value: number) => {
  emit('rate', value);
};
</script>
