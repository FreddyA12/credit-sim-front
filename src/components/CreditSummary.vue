<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div v-for="item in items" :key="item.label" class="rounded-xl shadow p-4 flex flex-col gap-1" :class="item.highlight ? 'bg-green-50 border border-green-200' : 'bg-white'">
      <p class="text-xs text-gray-500">{{ item.label }}</p>
      <p class="text-xl font-bold" :class="item.highlight ? 'text-green-700' : 'text-gray-800'">{{ item.value }}</p>
      <p v-if="item.hint" class="text-xs text-gray-400">{{ item.hint }}</p>
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
  const list: { label: string; value: string; hint?: string; highlight?: boolean }[] = [
    { label: s.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota', value: formatCurrency(s.firstInstallment ?? 0) },
    { label: 'Total a pagar', value: formatCurrency(s.totalCreditCost ?? 0) },
    { label: 'Total interés', value: formatCurrency(s.totalInterest ?? 0) },
    { label: 'SOLCA (0.5%)', value: formatCurrency(s.totalSolca ?? 0), hint: 'Cobro al desembolso — COMF Disp. Gral. 14ª' },
  ];
  if (s.netDisbursement != null) {
    list.push({
      label: 'Usted recibe',
      value: formatCurrency(s.netDisbursement),
      hint: `Monto menos descuentos al desembolso (${formatCurrency(s.totalDisbursementCharges ?? 0)})`,
      highlight: true,
    });
  }
  if (s.totalDesgravamen > 0) {
    list.push({ label: 'Seguro Desgravamen', value: formatCurrency(s.totalDesgravamen), hint: 'Total en todo el plazo' });
  }
  if (s.totalFire > 0) {
    list.push({ label: 'Seguro Incendio/Terremoto', value: formatCurrency(s.totalFire), hint: 'Total en todo el plazo' });
  }
  return list;
});
</script>
