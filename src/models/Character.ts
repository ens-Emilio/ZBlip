export type Waveform = 'square' | 'sine' | 'sawtooth' | 'triangle';

export interface CharacterProfile {
  pitch: number; // 0.5 - 2.0
  duration: number; // ms per character blip
  waveform: Waveform;
  volume: number; // 0.0 - 1.0
  charDelay: number; // ms between chars
  spaceDelay: number; // ms for spaces
}

export const CHARACTER_PRESETS: Record<string, CharacterProfile> = {
  hero: {
    pitch: 1.0,
    duration: 80,
    waveform: 'square',
    volume: 0.7,
    charDelay: 15,
    spaceDelay: 50,
  },
  villain: {
    pitch: 0.6,
    duration: 120,
    waveform: 'sawtooth',
    volume: 0.8,
    charDelay: 20,
    spaceDelay: 60,
  },
  child: {
    pitch: 1.8,
    duration: 60,
    waveform: 'sine',
    volume: 0.6,
    charDelay: 10,
    spaceDelay: 40,
  },
  robot: {
    pitch: 1.2,
    duration: 100,
    waveform: 'square',
    volume: 0.9,
    charDelay: 5,
    spaceDelay: 30,
  },
};
