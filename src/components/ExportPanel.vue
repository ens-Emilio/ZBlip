<template>
  <div class="export">
    <button class="btn primary" :disabled="!canExport" @click="$emit('export:audio')">
      📥 Download Áudio (WAV)
    </button>

    <button class="btn ghost" :disabled="!canExport" @click="$emit('export:srt')">
      📄 Download Legendas (SRT)
    </button>

    <button class="btn success" :disabled="!canExport" @click="$emit('export:zip')">
      📦 Download Completo (ZIP)
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canExport: boolean;
}>();

defineEmits<{
  (e: 'export:audio'): void;
  (e: 'export:srt'): void;
  (e: 'export:zip'): void;
}>();
</script>
