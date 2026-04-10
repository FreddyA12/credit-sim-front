<template>
  <Message v-if="show" :severity="capacityOk ? 'success' : 'warn'" :closable="false">
    <template v-if="capacityOk">
      Capacidad de pago: <strong>{{ formatCurrency(installment) }}</strong> representa el
      <strong>{{ percentage.toFixed(1) }}%</strong> de sus ingresos disponibles. Dentro del límite (40%).
    </template>
    <template v-else>
      Capacidad de pago insuficiente: la cuota <strong>{{ formatCurrency(installment) }}</strong>
      supera el 40% de sus ingresos netos disponibles. Reduzca el monto o amplíe el plazo.
    </template>
  </Message>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Message from 'primevue/message';
import { formatCurrency } from '../utils/financial-calculations';

const props = defineProps<{ installment: number; netIncome: number }>();
const show = computed(() => props.installment > 0 && props.netIncome > 0);
const percentage = computed(() => (props.installment / props.netIncome) * 100);
const capacityOk = computed(() => percentage.value <= 40);
</script>
