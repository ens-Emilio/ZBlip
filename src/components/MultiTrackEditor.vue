<template>
  <div class="multi-track">
    <div class="multi-track__header">
      <h3>Faixas (multi-voz)</h3>
      <button class="btn ghost" @click="addTrack">+ Nova faixa</button>
      <button class="btn primary" :disabled="!tracks.length" @click="$emit('mix')">🔀 Mixar</button>
    </div>

    <div v-if="!tracks.length" class="empty">Nenhuma faixa ainda. Adicione uma.</div>

    <div v-for="track in tracks" :key="track.id" class="track-card">
      <div class="track-row">
        <input v-model="track.name" class="track-name" placeholder="Nome da faixa" />
        <select v-model="track.profileKey">
          <option value="hero">Herói</option>
          <option value="villain">Vilão</option>
          <option value="child">Criança</option>
          <option value="robot">Robô</option>
        </select>
        <label class="inline">
          Início (ms)
          <input type="number" v-model.number="track.startTime" min="0" step="50" />
        </label>
        <label class="inline">
          Volume
          <input type="range" v-model.number="track.volume" min="0" max="1" step="0.05" />
        </label>
        <button class="btn ghost" @click="toggleMute(track)">{{ track.muted ? '🔇' : '🔊' }}</button>
        <button class="btn ghost" @click="toggleSolo(track)">{{ track.solo ? '🎧 Solo' : 'Solo' }}</button>
        <button class="btn danger" @click="removeTrack(track.id)">🗑</button>
      </div>
      <textarea
        v-model="track.text"
        rows="3"
        class="track-text"
        placeholder="Texto desta faixa (opcional tags [hero] etc.)"
        @input="notifyChange"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import type { MultiTrackRow } from '../models/Track';

const props = defineProps<{
  tracks?: MultiTrackRow[];
}>();

const emit = defineEmits<{
  (e: 'update:tracks', value: MultiTrackRow[]): void;
  (e: 'mix'): void;
}>();

const tracks = reactive<MultiTrackRow[]>([]);

watch(
  () => props.tracks,
  (incoming) => {
    if (!incoming || incoming.length === tracks.length) return;
    tracks.splice(0, tracks.length, ...incoming.map((t) => ({ ...t })));
  },
  { immediate: true },
);

function addTrack() {
  tracks.push({
    id: uuid(),
    name: `Faixa ${tracks.length + 1}`,
    profileKey: 'hero',
    text: '',
    startTime: 0,
    volume: 0.8,
    muted: false,
    solo: false,
  });
  notifyChange();
}

function removeTrack(id: string) {
  const idx = tracks.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tracks.splice(idx, 1);
    notifyChange();
  }
}

function toggleMute(track: MultiTrackRow) {
  track.muted = !track.muted;
  notifyChange();
}

function toggleSolo(track: MultiTrackRow) {
  const newValue = !track.solo;
  tracks.forEach((t) => {
    t.solo = false;
  });
  track.solo = newValue;
  notifyChange();
}

function notifyChange() {
  emit('update:tracks', [...tracks]);
}
</script>

<style scoped>
.multi-track {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.multi-track__header {
  display: flex;
  gap: 8px;
  align-items: center;
}
.empty {
  color: #7c8ba8;
}
.track-card {
  border: 1px solid #1f2940;
  border-radius: 10px;
  padding: 10px;
  background: #0f1727;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.track-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.track-name {
  flex: 1;
  min-width: 140px;
  padding: 6px;
}
.track-text {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #253452;
  background: #0c1322;
  color: #e8ecf2;
  padding: 8px;
}
.inline {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #d8e3f4;
}
.btn.danger {
  background: #2a0f14;
  border-color: #4d1a22;
}
</style>
