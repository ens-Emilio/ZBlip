import type { CharacterProfile } from '../models/Character';
import { CHARACTER_PRESETS } from '../models/Character';
import type { CharWithConfig } from './AudioEngine';

export interface ParsedSequence {
  sequence: CharWithConfig[];
  plainText: string;
}

export default class TextProcessor {
  private presets = CHARACTER_PRESETS;

  parseTextWithVoices(text: string, defaultVoice: CharacterProfile): ParsedSequence {
    const lines = text.split(/\r?\n/);
    const sequence: CharWithConfig[] = [];
    const outputChars: string[] = [];

    lines.forEach((rawLine) => {
      let line = rawLine;
      let voice = defaultVoice;
      const tagMatch = line.match(/^\s*\[([^\]]+)\]\s*/);
      if (tagMatch) {
        const rawKey = tagMatch[1];
        const key = rawKey ? rawKey.trim().toLowerCase() : '';
        const preset = this.presets[key as keyof typeof this.presets];
        voice = preset ?? defaultVoice;
        line = line.slice(tagMatch[0].length);
      }

      for (const ch of line) {
        sequence.push({ char: ch, config: voice });
        outputChars.push(ch);
      }
      // normalize newline -> space to keep timing consistent
      sequence.push({ char: ' ', config: voice });
      outputChars.push(' ');
    });

    return {
      sequence,
      plainText: outputChars.join('').trim(),
    };
  }
}
