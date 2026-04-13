<template>
  <Button :label="label" icon="pi pi-file-pdf" severity="secondary" @click="$emit('download')" />
</template>

<script setup lang="ts">
defineProps<{ label?: string }>();
defineEmits<{ (e: 'download'): void }>();
</script>
