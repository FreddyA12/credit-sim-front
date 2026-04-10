<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-700">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
      <div class="flex flex-col items-center mb-6">
        <img v-if="institution?.logoUrl" :src="institution.logoUrl" alt="logo" class="h-16 mb-2" />
        <h1 class="text-2xl font-bold text-center" :style="{ color: institution?.primaryColor || '#1A3C6E' }">
          {{ institution?.name || 'Simulador Financiero' }}
        </h1>
        <p v-if="institution?.slogan" class="text-sm text-gray-500 mt-1">{{ institution.slogan }}</p>
      </div>
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useInstitutionStore } from '../stores/institution.store';
import { storeToRefs } from 'pinia';

const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);

onMounted(() => institutionStore.fetch().catch(() => {}));
</script>
