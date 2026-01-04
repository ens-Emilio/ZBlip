import { formatSrtTimestamp } from '../utils/timeFormatter';

export interface TimingEntry {
  char: string;
  startTime: number;
  endTime: number;
}

export default class SubtitleGenerator {
  private charsPerSubtitle = 40;

  generateSRT(text: string, timingData: TimingEntry[]): string {
    const blocks = this.groupIntoBlocks(text, timingData);
    return blocks
      .map(
        (block, index) =>
          `${index + 1}\n${formatSrtTimestamp(block.startTime)} --> ${formatSrtTimestamp(block.endTime)}\n${block.text}\n`,
      )
      .join('\n');
  }

  private groupIntoBlocks(text: string, timingData: TimingEntry[]) {
    const blocks: { text: string; startTime: number; endTime: number }[] = [];
    const sentences = this.splitIntoSentences(text);

    let charIndex = 0;
    sentences.forEach((sentence) => {
      const len = sentence.length;
      const startTiming = timingData[charIndex];
      const endTiming = timingData[charIndex + len - 1];
      if (!startTiming || !endTiming) return;

      blocks.push({
        text: sentence.trim(),
        startTime: startTiming.startTime,
        endTime: endTiming.endTime,
      });

      charIndex += len;
    });

    return blocks;
  }

  private splitIntoSentences(text: string) {
    const sentences: string[] = [];
    let current = '';
    for (const char of text) {
      current += char;
      if (['.', '!', '?'].includes(char) || current.length >= this.charsPerSubtitle) {
        sentences.push(current);
        current = '';
      }
    }
    if (current) sentences.push(current);
    return sentences;
  }
}
