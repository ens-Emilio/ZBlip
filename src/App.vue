<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Blip Subtitle Generator</p>
        <h1>Texto em áudio blip com legendas sincronizadas</h1>
        <p class="lede">
          Digite seu roteiro, ajuste a voz e exporte áudio + SRT em um clique.
        </p>
        <p v-if="workerPending" class="lede worker-state">Worker: processando...</p>
      </div>
      <div class="actions">
        <button class="btn primary" @click="reset">Novo projeto</button>
        <button class="btn ghost">Importar texto</button>
        <button class="btn ghost" @click="undo" :disabled="!canUndo">↩ Undo</button>
        <button class="btn ghost" @click="redo" :disabled="!canRedo">↪ Redo</button>
        <button class="btn ghost" @click="toggleTheme">
          {{ theme === 'dark' ? '🌞 Claro' : '🌙 Escuro' }}
        </button>
      </div>
    </header>

    <main class="grid">
      <section class="panel">
        <header class="panel__head">
          <h2>Texto</h2>
          <small>Entrada e contagem</small>
        </header>
        <TextInput v-model="text" :max-length="5000" />
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2>Configurações de voz</h2>
          <small>Pitch, duração, forma de onda</small>
        </header>
        <CharacterSelector
          :config="character"
          @update:config="onCharacterChange"
          @load-preset="onPreset"
        />
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2>Faixas</h2>
          <small>Multi-voz e alinhamento</small>
        </header>
        <MultiTrackEditor :tracks="tracks" @update:tracks="onTracksUpdate" @mix="mixTracks" />
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2>Prévia</h2>
          <small>Player e status</small>
        </header>
        <WaveformTimeline
          v-if="audioBuffer"
          :audio-buffer="audioBuffer"
          :current-time="currentTime"
          :total-duration="totalDuration"
          @seek="onSeek"
        />
        <AudioPlayer
          :current-subtitle="currentSubtitle"
          :current-time="currentTime"
          :total-duration="totalDuration"
          :playback-rate="playbackRate"
          @seek="onSeek"
          @play="onPlay"
          @pause="onPause"
          @stop="onStop"
          @rate="onRateChange"
        />
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2>Legendas</h2>
          <small>Prévia do SRT + ajuste fino</small>
        </header>
        <div class="controls">
          <label class="control">
            <span>Offset global (ms): {{ timingOffset }}</span>
            <input type="range" min="-500" max="500" step="10" v-model.number="timingOffset" />
          </label>
        </div>
        <SubtitleDisplay :text="plainText" :timing="timingWithOffset" />
      </section>

      <section class="panel">
        <header class="panel__head">
          <h2>Exportar</h2>
          <small>Áudio + SRT</small>
        </header>
        <ExportPanel
          :can-export="Boolean(text)"
          @export:audio="exportAudio"
          @export:srt="exportSubtitles"
          @export:zip="exportZip"
        />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue';
import AudioPlayer from './components/AudioPlayer.vue';
import CharacterSelector from './components/CharacterSelector.vue';
import ExportPanel from './components/ExportPanel.vue';
import MultiTrackEditor from './components/MultiTrackEditor.vue';
import SubtitleDisplay from './components/SubtitleDisplay.vue';
import TextInput from './components/TextInput.vue';
import WaveformTimeline from './components/WaveformTimeline.vue';
import AudioEngine from './core/AudioEngine';
import SubtitleGenerator from './core/SubtitleGenerator';
import AudioExporter from './core/AudioExporter';
import PlayerController from './core/PlayerController';
import TextProcessor from './core/TextProcessor';
import type { CharacterProfile } from './models/Character';
import { CHARACTER_PRESETS } from './models/Character';
import type { MultiTrackRow } from './models/Track';
import { KeyboardShortcutManager } from './utils/keyboardShortcuts';
import { v4 as uuid } from 'uuid';
// Worker stub (mock async generation)
const audioWorker = new Worker(new URL('./workers/audioWorker.ts', import.meta.url), { type: 'module' });

const text = ref('');
const plainText = ref('');
const character = reactive<CharacterProfile>({
  pitch: 1.0,
  duration: 80,
  waveform: 'square',
  volume: 0.7,
  charDelay: 15,
  spaceDelay: 50,
});

const audioEngine = new AudioEngine();
const subtitleGenerator = new SubtitleGenerator();
const audioExporter = new AudioExporter();
const textProcessor = new TextProcessor();

const currentTime = ref(0);
const totalDuration = ref(0);
const timingData = ref<{ char: string; startTime: number; endTime: number }[]>([]);
const audioBuffer = ref<AudioBuffer | null>(null);
const isPlaying = ref(false);
const timingOffset = ref(0);
const playbackRate = ref(1);
const tracks = ref<MultiTrackRow[]>([]);
const workerPending = ref(false);
const theme = ref<'dark' | 'light'>('dark');

type Snapshot = {
  text: string;
  character: CharacterProfile;
  tracks: MultiTrackRow[];
};
const history = ref<Snapshot[]>([]);
const historyIndex = ref(-1);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);
let textDebounceHandle: number | undefined;

const player = new PlayerController();
let tickHandle: number | undefined;
let shortcuts: KeyboardShortcutManager | null = null;

const currentSubtitle = computed(() =>
  plainText.value ? 'Prévia de legenda gerada automaticamente.' : '',
);
const timingWithOffset = computed(() =>
  timingData.value.map((t) => ({
    ...t,
    startTime: t.startTime + timingOffset.value,
    endTime: t.endTime + timingOffset.value,
  })),
);

const reset = () => {
  text.value = '';
  plainText.value = '';
  timingData.value = [];
  audioBuffer.value = null;
  totalDuration.value = 0;
  currentTime.value = 0;
};

const generate = async () => {
  if (!text.value.trim()) {
    reset();
    return;
  }
  const parsed = textProcessor.parseTextWithVoices(text.value, character);
  plainText.value = parsed.plainText;
  const result = await audioEngine.generateFromSequence(parsed.sequence);
  audioBuffer.value = result.audioBuffer;
  timingData.value = result.timingData;
  totalDuration.value = result.totalDuration;
};

const onCharacterChange = (value: CharacterProfile) => {
  Object.assign(character, value);
  pushHistory();
  if (text.value) generate();
};

const onPreset = (preset: CharacterProfile) => {
  Object.assign(character, preset);
  pushHistory();
  if (text.value) generate();
};

const onSeek = (ms: number) => {
  currentTime.value = ms;
  player.seek(ms);
};
const onPlay = () => {
  if (!audioBuffer.value) return;
  player.play();
  player.setRate(playbackRate.value);
  isPlaying.value = true;
  startTick();
};
const onPause = () => {
  player.pause();
  isPlaying.value = false;
  stopTick();
};
const onStop = () => {
  currentTime.value = 0;
  player.stop();
  isPlaying.value = false;
  stopTick();
};

const exportAudio = () => {
  if (!audioBuffer.value) return;
  audioExporter.exportWAV(audioBuffer.value);
};
const exportSubtitles = () => {
  const srt = subtitleGenerator.generateSRT(plainText.value, timingWithOffset.value);
  audioExporter.exportSRT(srt);
};
const exportZip = async () => {
  if (!audioBuffer.value) return;
  const srt = subtitleGenerator.generateSRT(plainText.value, timingWithOffset.value);
  await audioExporter.exportZip(audioBuffer.value, srt);
};

const onRateChange = (value: number) => {
  playbackRate.value = value;
  player.setRate(playbackRate.value);
};

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  applyTheme();
};

const applyTheme = () => {
  document.documentElement.setAttribute('data-theme', theme.value);
  localStorage.setItem('zblip-theme', theme.value);
};

const onTracksUpdate = (value: MultiTrackRow[]) => {
  tracks.value = value;
  pushHistory();
};

const mixTracks = async () => {
  await requestWorkerStub('mix');
  const slots: { buffer: AudioBuffer; startMs: number; gain: number }[] = [];
  const mergedTiming: { char: string; startTime: number; endTime: number }[] = [];
  const plainParts: string[] = [];

  const anySolo = tracks.value.some((t) => t.solo);

  for (const track of tracks.value) {
    const textForTrack = track.text?.trim() ?? '';
    if (!textForTrack) continue;

    if (anySolo && !track.solo) {
      continue;
    }
    if (!anySolo && track.muted) {
      continue;
    }

    const preset = CHARACTER_PRESETS[track.profileKey] ?? character;
    const parsed = textProcessor.parseTextWithVoices(textForTrack, preset);
    plainParts.push(`${track.name}: ${parsed.plainText}`);

    const result = await audioEngine.generateFromSequence(parsed.sequence);
    if (result.audioBuffer) {
      if (!track.muted) {
        slots.push({
          buffer: result.audioBuffer,
          startMs: track.startTime ?? 0,
          gain: track.volume ?? 1,
        });
      }
      result.timingData.forEach((t) =>
        mergedTiming.push({
          ...t,
          startTime: t.startTime + (track.startTime ?? 0),
          endTime: t.endTime + (track.startTime ?? 0),
        }),
      );
    }
  }

  const mixed = audioEngine.mixBuffers(slots);
  audioBuffer.value = mixed;
  plainText.value = plainParts.join('\n');
  timingData.value = mergedTiming.sort((a, b) => a.startTime - b.startTime);
  totalDuration.value = Math.floor((mixed.length / mixed.sampleRate) * 1000);
  currentTime.value = 0;
};

const pushHistory = () => {
  const snap: Snapshot = {
    text: text.value,
    character: { ...character },
    tracks: tracks.value.map((t) => ({ ...t })),
  };
  // discard redo stack
  if (historyIndex.value < history.value.length - 1) {
    history.value.splice(historyIndex.value + 1);
  }
  history.value.push(snap);
  historyIndex.value = history.value.length - 1;
};

const undo = () => {
  if (historyIndex.value <= 0) return;
  historyIndex.value -= 1;
  applySnapshot(history.value[historyIndex.value]);
};

const redo = () => {
  if (historyIndex.value >= history.value.length - 1) return;
  historyIndex.value += 1;
  applySnapshot(history.value[historyIndex.value]);
};

const applySnapshot = (snap?: Snapshot) => {
  if (!snap) return;
  text.value = snap.text;
  Object.assign(character, snap.character);
  tracks.value = snap.tracks.map((t) => ({ ...t }));
  generate();
};

const requestWorkerStub = (label: string): Promise<void> => {
  return new Promise((resolve) => {
    const requestId = uuid();
    const onMessage = (event: MessageEvent<{ type: string; requestId: string }>) => {
      if (event.data?.type === 'done' && event.data.requestId === requestId) {
        audioWorker.removeEventListener('message', onMessage as EventListener);
        workerPending.value = false;
        resolve();
      }
    };
    audioWorker.addEventListener('message', onMessage as EventListener);
    workerPending.value = true;
    audioWorker.postMessage({ type: 'generate', requestId, label });
  });
};

watch(
  () => text.value,
  () => {
    generate();
    if (textDebounceHandle !== undefined) {
      clearTimeout(textDebounceHandle);
    }
    textDebounceHandle = window.setTimeout(() => pushHistory(), 400);
  },
  { immediate: true },
);

watch(
  () => audioBuffer.value,
  async (buf) => {
    if (buf) {
      await player.load(buf);
      currentTime.value = 0;
      player.setRate(playbackRate.value);
    } else {
      player.cleanup();
    }
  },
);

function startTick() {
  stopTick();
  const step = () => {
    currentTime.value = player.getPositionMs();
    if (isPlaying.value) {
      tickHandle = requestAnimationFrame(step);
    }
  };
  tickHandle = requestAnimationFrame(step);
}

function stopTick() {
  if (tickHandle !== undefined) {
    cancelAnimationFrame(tickHandle);
    tickHandle = undefined;
  }
}

onMounted(() => {
  shortcuts = new KeyboardShortcutManager();
  shortcuts.on('play_pause', () => {
    if (isPlaying.value) {
      onPause();
    } else {
      onPlay();
    }
  });
  shortcuts.on('seek_forward', () => {
    onSeek(Math.min(totalDuration.value, currentTime.value + 5000));
  });
  shortcuts.on('seek_backward', () => {
    onSeek(Math.max(0, currentTime.value - 5000));
  });
  shortcuts.on('undo', () => undo());
  shortcuts.on('redo', () => redo());
  pushHistory();
  const savedTheme = localStorage.getItem('zblip-theme') as 'dark' | 'light' | null;
  if (savedTheme === 'light' || savedTheme === 'dark') {
    theme.value = savedTheme;
  }
  applyTheme();
});

onUnmounted(() => {
  shortcuts?.destroy();
});
</script>
