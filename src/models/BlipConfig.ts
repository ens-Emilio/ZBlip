import type { Waveform } from './Character';

export interface BlipConfig {
  duration: number; // ms
  pitch: number;
  waveform: Waveform;
  volume: number;
  charDelay?: number;
  spaceDelay?: number;
}
