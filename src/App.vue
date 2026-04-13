<template>
  <Toast />
  <ConfirmDialog />
  <RouterView />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useTheme } from './composables/useTheme';

// Aplicar tema dinámico basado en la institución
const { applyTheme } = useTheme();

onMounted(() => {
  applyTheme();
});
</script>
