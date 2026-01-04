import type { CharacterProfile } from './Character';

export interface TrackSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  audioBuffer?: AudioBuffer;
  volume?: number;
}

export interface Track {
  id: string;
  name: string;
  characterProfile: CharacterProfile;
  segments: TrackSegment[];
  volume: number;
  muted: boolean;
  solo: boolean;
}

export interface MultiTrackRow {
  id: string;
  name: string;
  profileKey: 'hero' | 'villain' | 'child' | 'robot';
  text: string;
  startTime: number;
  volume: number;
  muted: boolean;
  solo?: boolean;
}
