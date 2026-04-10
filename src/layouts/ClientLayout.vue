<template>
  <div class="min-h-screen bg-gray-50">
    <header class="shadow-sm bg-white" :style="{ borderBottom: `3px solid ${institution?.primaryColor || '#1A3C6E'}` }">
      <div class="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
        <div class="flex items-center gap-3">
          <img v-if="institution?.logoUrl" :src="institution.logoUrl" alt="logo" class="h-10" />
          <RouterLink :to="`/${slug}`" class="font-bold text-lg" :style="{ color: institution?.primaryColor || '#1A3C6E' }">
            {{ institution?.name || 'Simulador Financiero' }}
          </RouterLink>
        </div>
        <nav class="flex gap-1 flex-wrap">
          <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to"
            class="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-700 transition-colors px-2 py-1 rounded"
            active-class="text-blue-700 font-semibold bg-blue-50">
            <i :class="link.icon" class="text-xs" />
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="max-w-6xl mx-auto px-6 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useInstitutionStore } from '../stores/institution.store';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);

const navLinks = computed(() => [
  { to: `/${slug.value}/creditos`, icon: 'pi pi-calculator', label: 'Simulador Crédito' },
  { to: `/${slug.value}/solicitar-credito`, icon: 'pi pi-file-edit', label: 'Solicitar Crédito' },
  { to: `/${slug.value}/inversiones`, icon: 'pi pi-chart-bar', label: 'Simulador Inversión' },
  { to: `/${slug.value}/invertir`, icon: 'pi pi-wallet', label: 'Invertir' },
  { to: `/${slug.value}/estado`, icon: 'pi pi-search', label: 'Mi Estado' },
]);

onMounted(() => institutionStore.fetchBySlug(slug.value).catch(() => {}));
watch(slug, (s) => { if (s) institutionStore.fetchBySlug(s).catch(() => {}); });
</script>
