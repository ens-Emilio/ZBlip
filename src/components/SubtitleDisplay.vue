<template>
  <div class="subtitle-preview">
    <div class="subtitle-preview__header">
      <span>SRT Preview</span>
      <span class="subtitle-preview__count">{{ blocks.length }} blocos</span>
    </div>
    <div class="subtitle-preview__list">
      <div v-if="!text" class="subtitle-preview__empty">Nenhum texto ainda.</div>
      <div v-else class="subtitle-block" v-for="(block, index) in blocks" :key="index">
        <div class="subtitle-block__time">
          {{ block.start }} → {{ block.end }}
        </div>
        <div class="subtitle-block__text">
          {{ block.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TimingEntry } from '../core/SubtitleGenerator';
import { formatSrtTimestamp } from '../utils/timeFormatter';

const props = defineProps<{
  text: string;
  timing: TimingEntry[];
}>();

const blocks = computed(() => {
  if (!props.text || !props.timing.length) return [];
  const chars = props.text.split('');
  const out: { text: string; start: string; end: string }[] = [];
  const first = props.timing[0];
  if (!first) return out;

  let current = '';
  let start = first.startTime;
  let end = first.endTime;

  chars.forEach((char, idx) => {
    current += char;
    const timing = props.timing[idx];
    end = timing?.endTime ?? end;
    if (['.', '!', '?'].includes(char) || current.length >= 40 || idx === chars.length - 1) {
      out.push({
        text: current.trim(),
        start: formatSrtTimestamp(start),
        end: formatSrtTimestamp(end),
      });
      current = '';
      const next = props.timing[idx + 1];
      start = next ? next.startTime : end;
    }
  });

  return out;
});
</script>
