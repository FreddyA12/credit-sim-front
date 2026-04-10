<template>
  <DataTable :value="schedule" stripedRows size="small" scrollable scrollHeight="400px">
    <Column field="number" header="#" />
    <Column header="Cuota total">
      <template #body="{ data }">${{ data.totalPayment?.toFixed(2) }}</template>
    </Column>
    <Column header="Capital">
      <template #body="{ data }">${{ data.principal?.toFixed(2) }}</template>
    </Column>
    <Column header="Interés">
      <template #body="{ data }">${{ data.interest?.toFixed(2) }}</template>
    </Column>
    <Column v-if="hasAdditional" header="Cargos adic.">
      <template #body="{ data }">${{ data.totalAdditionalCharges?.toFixed(2) }}</template>
    </Column>
    <Column header="Saldo">
      <template #body="{ data }">${{ data.balance?.toFixed(2) }}</template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const props = defineProps<{ schedule: any[] }>();
const hasAdditional = computed(() => props.schedule.some((r) => (r.totalAdditionalCharges ?? 0) > 0));
</script>
