<template>
  <div class="flex flex-col items-center gap-8 py-8">
    <div v-if="institution" class="text-center">
      <img v-if="institution.logoUrl" :src="institution.logoUrl" alt="logo" class="h-20 mx-auto mb-4" />
      <h1 class="text-3xl font-bold" :style="{ color: institution.primaryColor }">{{ institution.name }}</h1>
      <p v-if="institution.slogan" class="text-gray-500 mt-2 text-lg">{{ institution.slogan }}</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
      <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="$router.push(`/${slug}/creditos`)">
        <template #content>
          <div class="flex flex-col items-center gap-3 py-4">
            <i class="pi pi-calculator text-4xl text-blue-600" />
            <h2 class="text-xl font-bold text-gray-800">Simulador de Crédito</h2>
            <p class="text-sm text-gray-500 text-center">Simule su crédito y vea la tabla de pagos con todos los cargos aplicables.</p>
            <Button label="Simular crédito" icon="pi pi-arrow-right" iconPos="right" />
          </div>
        </template>
      </Card>

      <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="$router.push(`/${slug}/inversiones`)">
        <template #content>
          <div class="flex flex-col items-center gap-3 py-4">
            <i class="pi pi-chart-line text-4xl text-green-600" />
            <h2 class="text-xl font-bold text-gray-800">Simulador de Inversión</h2>
            <p class="text-sm text-gray-500 text-center">Calcule los rendimientos de su depósito a plazo fijo.</p>
            <Button label="Simular inversión" icon="pi pi-arrow-right" iconPos="right" severity="success" />
          </div>
        </template>
      </Card>

      <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="$router.push(`/${slug}/solicitar-credito`)">
        <template #content>
          <div class="flex flex-col items-center gap-3 py-4">
            <i class="pi pi-file-edit text-4xl text-purple-600" />
            <h2 class="text-xl font-bold text-gray-800">Solicitar Crédito</h2>
            <p class="text-sm text-gray-500 text-center">Envíe su solicitud de crédito con verificación de identidad.</p>
            <Button label="Solicitar" icon="pi pi-arrow-right" iconPos="right" severity="secondary" />
          </div>
        </template>
      </Card>

      <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="$router.push(`/${slug}/estado`)">
        <template #content>
          <div class="flex flex-col items-center gap-3 py-4">
            <i class="pi pi-search text-4xl text-orange-600" />
            <h2 class="text-xl font-bold text-gray-800">Estado de Solicitud</h2>
            <p class="text-sm text-gray-500 text-center">Consulte el estado de su solicitud usando su número de cédula.</p>
            <Button label="Consultar" icon="pi pi-arrow-right" iconPos="right" severity="warn" />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Button from 'primevue/button';
import { useInstitutionStore } from '../../stores/institution.store';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const { institution } = storeToRefs(useInstitutionStore());
</script>
