<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div v-for="item in items" :key="item.label" class="bg-white rounded-xl shadow p-4 flex flex-col gap-1">
      <p class="text-xs text-gray-500">{{ item.label }}</p>
      <p class="text-xl font-bold text-gray-800">{{ item.value }}</p>
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
    { label: 'Cuota (1ª)', value: formatCurrency(s.firstInstallment ?? 0) },
    { label: 'Total a pagar', value: formatCurrency(s.totalCreditCost ?? 0) },
    { label: 'Total interés', value: formatCurrency(s.totalInterest ?? 0) },
    { label: 'SOLCA', value: formatCurrency(s.totalSolca ?? 0) },
  ];
});
</script>
