import BlipGenerator from './BlipGenerator';
import type { CharacterProfile } from '../models/Character';
import { mergeBuffers } from '../utils/audioBuffer';

export interface GeneratedAudio {
  audioBuffer: AudioBuffer;
  timingData: { char: string; startTime: number; endTime: number }[];
  totalDuration: number;
}

export interface CharWithConfig {
  char: string;
  config: CharacterProfile;
}

export interface BufferSlot {
  buffer: AudioBuffer;
  startMs: number;
  gain: number;
}

export default class AudioEngine {
  private audioContext: AudioContext;
  private blipGenerator: BlipGenerator;
  private cache: Map<string, AudioBuffer>;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.blipGenerator = new BlipGenerator(this.audioContext);
    this.cache = new Map();
  }

  async generateAudioFromText(text: string, characterConfig: CharacterProfile): Promise<GeneratedAudio> {
    const characters = this.preprocessText(text).map((char) => ({ char, config: characterConfig }));
    return this.generateFromSequence(characters);
  }

  async generateFromSequence(sequence: CharWithConfig[]): Promise<GeneratedAudio> {
    const characters = sequence;
    const audioBuffers: AudioBuffer[] = [];
    const timingData: GeneratedAudio['timingData'] = [];

    let currentTime = 0;

    characters.forEach(({ char, config }, index) => {
      if (char === ' ') {
        const silence = this.createSilence(config.spaceDelay || 50);
        audioBuffers.push(silence);
        currentTime += config.spaceDelay || 50;
        return;
      }

      const key = this.cacheKey(char, config);
      const cached = this.cache.get(key);
      const buffer = cached ?? this.blipGenerator.renderBlip(char, config);
      if (!cached) this.cache.set(key, buffer);
      audioBuffers.push(buffer);

      timingData.push({
        char,
        startTime: currentTime,
        endTime: currentTime + config.duration,
      });

      currentTime += config.duration;

      const delay = index < characters.length - 1 ? config.charDelay || 10 : 0;
      if (delay > 0) {
        const silence = this.createSilence(delay);
        audioBuffers.push(silence);
        currentTime += delay;
      }
    });

    return {
      audioBuffer: mergeBuffers(this.audioContext, audioBuffers),
      timingData,
      totalDuration: currentTime,
    };
  }

  private preprocessText(text: string): string[] {
    return text
      .split('')
      .filter((c) => /[a-zA-Z0-9\s.,!?áéíóúãõâêîôûàèìòùç]/i.test(c));
  }

  private createSilence(durationMs: number): AudioBuffer {
    const length = Math.max(1, Math.floor((this.audioContext.sampleRate * durationMs) / 1000));
    return this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
  }

  private cacheKey(char: string, cfg: CharacterProfile) {
    return `${char}-${cfg.waveform}-${cfg.pitch}-${cfg.duration}-${cfg.volume}`;
  }

  mixBuffers(slots: BufferSlot[]): AudioBuffer {
    if (!slots.length) {
      return this.createSilence(1);
    }
    const sampleRate = this.audioContext.sampleRate;
    const totalLength = slots.reduce((max, slot) => {
      const startSamples = Math.floor((slot.startMs / 1000) * sampleRate);
      return Math.max(max, startSamples + slot.buffer.length);
    }, 0);

    if (!Number.isFinite(totalLength) || totalLength <= 0) {
      return this.createSilence(1);
    }

    const result = this.audioContext.createBuffer(1, totalLength, sampleRate);
    const out = result.getChannelData(0);

    slots.forEach(({ buffer, startMs, gain }) => {
      const start = Math.floor((startMs / 1000) * sampleRate);
      const data = buffer.getChannelData(0);
      const g = gain ?? 1;
      for (let i = 0; i < data.length; i++) {
        const idx = start + i;
        if (idx >= 0 && idx < out.length) {
          const sample = data[i] ?? 0;
          out[idx] = (out[idx] ?? 0) + sample * g;
        }
      }
    });

    // Normalize if clipping
    let peak = 0;
    for (let i = 0; i < out.length; i++) {
      const v = out[i] ?? 0;
      peak = Math.max(peak, Math.abs(v));
    }
    if (peak > 1) {
      const scale = 0.98 / peak;
      for (let i = 0; i < out.length; i++) {
        out[i] = (out[i] ?? 0) * scale;
      }
    }

    return result;
  }
}
