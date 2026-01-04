import type { BlipConfig } from '../models/BlipConfig';

export default class BlipGenerator {
  private audioContext: AudioContext;
  private baseFrequency = 440; // A4

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  getFrequencyForChar(char: string, pitchModifier = 1.0): number {
    const vowels = 'aeiouáéíóúãõâêîôûàèìòùç';
    const isVowel = vowels.includes(char.toLowerCase());
    const baseOffset = isVowel ? 1.2 : 1.0;
    return this.baseFrequency * pitchModifier * baseOffset;
  }

  renderBlip(char: string, config: BlipConfig): AudioBuffer {
    const durationSec = config.duration / 1000;
    const length = Math.max(1, Math.floor(this.audioContext.sampleRate * durationSec));
    const buffer = this.audioContext.createBuffer(1, length, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    const freq = this.getFrequencyForChar(char, config.pitch);

    for (let i = 0; i < length; i++) {
      const t = i / this.audioContext.sampleRate;
      const envelope = Math.exp(-t * 20);
      data[i] = envelope * Math.sin(2 * Math.PI * freq * t) * (config.volume ?? 0.7);
    }

    return buffer;
  }
}
