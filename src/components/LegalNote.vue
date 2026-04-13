<template>
  <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 flex gap-2 items-start">
    <i class="pi pi-info-circle mt-0.5 flex-shrink-0" />
    <div>
      <p class="font-semibold mb-1">Nota legal</p>
      <p>{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>();
</script>
