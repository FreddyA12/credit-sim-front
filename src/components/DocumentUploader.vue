<template>
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium">{{ label }}</label>
    <FileUpload mode="basic" :accept="accept" :maxFileSize="5000000" :chooseLabel="chooseLabel"
      @select="onSelect" :auto="false" />
    <div v-if="uploadedUrl" class="text-sm text-green-600 flex items-center gap-1">
      <i class="pi pi-check-circle" />
      Archivo subido correctamente
    </div>
    <small v-if="hint" class="text-gray-400">{{ hint }}</small>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import FileUpload from 'primevue/fileupload';
import api from '../services/api';

const props = defineProps<{ label: string; accept?: string; chooseLabel?: string; hint?: string }>();
const emit = defineEmits<{ (e: 'uploaded', url: string): void }>();
const uploadedUrl = ref('');

async function onSelect(event: any) {
  const file = event.files[0];
  if (!file) return;
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/uploads/document', form);
  uploadedUrl.value = data.url;
  emit('uploaded', data.url);
}
</script>
