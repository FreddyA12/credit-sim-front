<template>
  <div class="credit-bureau-check">
    <h3 class="text-lg font-semibold text-gray-800 mb-4">Consulta de Buró de Crédito</h3>

    <!-- Input y botón -->
    <div class="flex gap-3 mb-4">
      <InputText
        v-model="cedula"
        placeholder="Ingresar cédula (10 dígitos)"
        :disabled="loading"
        maxlength="10"
        class="flex-1"
        @keyup.enter="handleCheck"
      />
      <Button
        label="Consultar"
        icon="pi pi-search"
        :loading="loading"
        :disabled="!cedula || loading"
        @click="handleCheck"
      />
    </div>

    <!-- Mensaje de error -->
    <Message v-if="error" severity="error" :text="error" class="mb-4" />

    <!-- Resultado -->
    <div v-if="result && !loading" class="border-l-4" :class="borderColor">
      <div class="bg-gray-50 p-4 rounded">
        <div class="grid grid-cols-3 gap-4">
          <!-- Score -->
          <div class="text-center">
            <div class="text-2xl font-bold" :class="textColor">{{ result.score }}</div>
            <div class="text-xs text-gray-600 mt-1">Puntuación</div>
          </div>

          <!-- Rating -->
          <div class="text-center">
            <Tag :value="result.rating" :severity="tagSeverity" class="text-sm" />
            <div class="text-xs text-gray-600 mt-2">Calificación</div>
          </div>

          <!-- Riesgo -->
          <div class="text-center">
            <div class="text-sm font-medium capitalize" :class="textColor">
              {{ riskLabel }}
            </div>
            <div class="text-xs text-gray-600 mt-1">Nivel de riesgo</div>
          </div>
        </div>

        <!-- Recomendación -->
        <div class="mt-4 p-3 bg-white rounded border border-gray-200">
          <p class="text-sm text-gray-700">
            <strong>Recomendación:</strong>
            {{ recommendationText }}
          </p>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div v-if="!result && !loading && !error" class="text-center py-6 text-gray-400">
      <i class="pi pi-search text-3xl block mb-2"></i>
      <p class="text-sm">Ingresa una cédula para consultar el buró de crédito</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCreditBureau } from '../composables/useCreditBureau';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Message from 'primevue/message';

const { loading, error, result, checkCedula } = useCreditBureau();
const cedula = ref('');

const handleCheck = async () => {
  await checkCedula(cedula.value);
};

const tagSeverity = computed(() => {
  if (!result.value) return 'info';
  switch (result.value.riskLevel) {
    case 'bajo':
      return 'success';
    case 'medio':
      return 'warning';
    case 'alto':
      return 'danger';
    default:
      return 'info';
  }
});

const textColor = computed(() => {
  if (!result.value) return '';
  switch (result.value.riskLevel) {
    case 'bajo':
      return 'text-green-600';
    case 'medio':
      return 'text-yellow-600';
    case 'alto':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
});

const borderColor = computed(() => {
  if (!result.value) return 'border-gray-300';
  switch (result.value.riskLevel) {
    case 'bajo':
      return 'border-green-500';
    case 'medio':
      return 'border-yellow-500';
    case 'alto':
      return 'border-red-500';
    default:
      return 'border-gray-300';
  }
});

const riskLabel = computed(() => {
  if (!result.value) return '';
  const labels = {
    bajo: 'Bajo',
    medio: 'Medio',
    alto: 'Alto',
  };
  return labels[result.value.riskLevel];
});

const recommendationText = computed(() => {
  if (!result.value) return '';
  switch (result.value.riskLevel) {
    case 'bajo':
      return 'Buena capacidad de crédito. Se recomienda aprobar con condiciones estándar.';
    case 'medio':
      return 'Capacidad de crédito moderada. Se recomienda solicitar documentación adicional.';
    case 'alto':
      return 'Alto riesgo de crédito. Se recomienda rechazar o estudiar con mayor profundidad.';
    default:
      return '';
  }
});
</script>

<style scoped>
.credit-bureau-check {
  /* Base styles */
}
</style>
