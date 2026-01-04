<template>
  <div class="controls">
    <div class="presets">
      <button class="btn ghost" @click="handlePreset('hero')">Herói</button>
      <button class="btn ghost" @click="handlePreset('villain')">Vilão</button>
      <button class="btn ghost" @click="handlePreset('child')">Criança</button>
      <button class="btn ghost" @click="handlePreset('robot')">Robô</button>
    </div>

    <label class="control">
      <span>Pitch: {{ config.pitch.toFixed(1) }}</span>
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        :value="config.pitch"
        @input="update('pitch', $event)"
      />
    </label>

    <label class="control">
      <span>Duração (ms/letra): {{ config.duration }}</span>
      <input
        type="range"
        min="50"
        max="150"
        step="10"
        :value="config.duration"
        @input="update('duration', $event)"
      />
    </label>

    <label class="control">
      <span>Forma de onda</span>
      <select :value="config.waveform" @change="update('waveform', $event)">
        <option value="square">Square (8-bit clássico)</option>
        <option value="sine">Sine (suave)</option>
        <option value="sawtooth">Sawtooth (áspero)</option>
        <option value="triangle">Triangle</option>
      </select>
    </label>
  </div>

  <div class="custom-presets">
    <div class="custom-presets__row">
      <input
        v-model="newPresetName"
        class="preset-input"
        type="text"
        placeholder="Nome do preset"
        maxlength="40"
      />
      <button class="btn primary" @click="saveCustomPreset" :disabled="!newPresetName.trim()">Salvar</button>
    </div>
    <div v-if="savedPresets.length" class="custom-presets__list">
      <div v-for="preset in savedPresets" :key="preset.name" class="preset-item">
        <span class="preset-name">{{ preset.name }}</span>
        <div class="preset-actions">
          <button class="btn ghost" @click="applyCustomPreset(preset)">Aplicar</button>
          <button class="btn danger" @click="removeCustomPreset(preset.name)">Remover</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { CharacterProfile } from '../models/Character';
import { CHARACTER_PRESETS as presets } from '../models/Character';

type PresetKey = 'hero' | 'villain' | 'child' | 'robot';
type SavedPreset = { name: string; config: CharacterProfile };

const STORAGE_KEY = 'zblip-presets';

const props = defineProps<{
  config: CharacterProfile;
}>();

const emit = defineEmits<{
  (e: 'update:config', value: CharacterProfile): void;
  (e: 'load-preset', preset: CharacterProfile): void;
}>();

const savedPresets = ref<SavedPreset[]>([]);
const newPresetName = ref('');

const update = (field: keyof CharacterProfile, event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement;
  const value = field === 'waveform' ? target.value : Number(target.value);
  emit('update:config', { ...props.config, [field]: value });
};

const handlePreset = (key: PresetKey) => {
  const preset = presets[key];
  if (!preset) return;
  emit('load-preset', preset);
};

const saveCustomPreset = () => {
  const name = newPresetName.value.trim();
  if (!name) return;
  const existingIdx = savedPresets.value.findIndex((p) => p.name === name);
  const entry: SavedPreset = { name, config: { ...props.config } };
  if (existingIdx >= 0) {
    savedPresets.value.splice(existingIdx, 1, entry);
  } else {
    savedPresets.value.push(entry);
  }
  persist();
  newPresetName.value = '';
};

const applyCustomPreset = (preset: SavedPreset) => {
  emit('load-preset', { ...preset.config });
};

const removeCustomPreset = (name: string) => {
  savedPresets.value = savedPresets.value.filter((p) => p.name !== name);
  persist();
};

const persist = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPresets.value));
};

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedPreset[];
      if (Array.isArray(parsed)) {
        savedPresets.value = parsed;
      }
    }
  } catch {
    savedPresets.value = [];
  }
});
</script>

<style scoped>
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-presets {
  margin-top: 10px;
  border-top: 1px solid #1f2940;
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-presets__row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.preset-input {
  flex: 1;
  min-width: 180px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #253452;
  background: #0f1727;
  color: #e5edff;
}

.custom-presets__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preset-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid #1f2940;
  border-radius: 8px;
  background: #0b1322;
}

.preset-name {
  font-weight: 600;
  color: #c7d7ff;
}

.preset-actions {
  display: flex;
  gap: 6px;
}
</style>
