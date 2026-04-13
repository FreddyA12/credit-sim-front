<template>
  <div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="item in items" :key="item.label" class="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
        <p class="text-xs text-gray-500">{{ item.label }}</p>
        <p class="text-xl font-bold text-gray-800">{{ item.value }}</p>
        <p v-if="item.hint" class="text-xs text-gray-400">{{ item.hint }}</p>
      </div>
    </div>
    <div v-if="summary.totalDesgravamen > 0 || summary.totalFire > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
      <div v-if="summary.totalDesgravamen > 0" class="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
        <p class="text-xs text-gray-500">Seguro Desgravamen</p>
        <p class="text-xl font-bold text-gray-800">{{ formatCurrency(summary.totalDesgravamen) }}</p>
        <p class="text-xs text-gray-400">Total en todo el plazo</p>
      </div>
      <div v-if="summary.totalFire > 0" class="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
        <p class="text-xs text-gray-500">Seguro Incendio/Terremoto</p>
        <p class="text-xl font-bold text-gray-800">{{ formatCurrency(summary.totalFire) }}</p>
        <p class="text-xs text-gray-400">Total en todo el plazo</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatCurrency } from '../utils/financial-calculations';

const props = defineProps<{ summary: any }>();

const items = computed(() => {
  const s = props.summary;
  if (!s) return [];
  return [
    { label: s.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota', value: formatCurrency(s.firstInstallment ?? 0) },
    { label: 'Total a pagar', value: formatCurrency(s.totalCreditCost ?? 0) },
    { label: 'Total interés', value: formatCurrency(s.totalInterest ?? 0) },
    { label: 'SOLCA (0.5%)', value: formatCurrency(s.totalSolca ?? 0), hint: 'Cobro automático al desembolso — COMF Disp. Gral. 14ª' },
  ];
});
</script>
