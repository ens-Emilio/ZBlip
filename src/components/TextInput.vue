<template>
  <div class="text-input">
    <textarea
      :value="modelValue"
      class="textarea"
      rows="10"
      :maxlength="maxLength"
      placeholder="Digite seu texto aqui..."
      @input="onInput"
    />
    <div class="text-input__meta">
      <span>{{ modelValue.length }} / {{ maxChars }} caracteres</span>
      <span v-if="modelValue.length >= maxChars">Limite máximo atingido.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: string;
  maxLength?: number;
}>();

const maxChars = computed(() => props.maxLength ?? 5000);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const onInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  const next = target.value.slice(0, maxChars.value);
  emit('update:modelValue', next);
};
</script>
