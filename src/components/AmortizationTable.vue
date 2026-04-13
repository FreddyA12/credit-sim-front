<template>
  <DataTable :value="tableData" stripedRows size="small" scrollable>
    <Column field="number" header="#" />
    <Column header="Cuota total">
      <template #body="{ data }">{{ data.isRow0 ? '—' : `$${data.totalPayment?.toFixed(2)}` }}</template>
    </Column>
    <Column header="Capital">
      <template #body="{ data }">{{ data.isRow0 ? '—' : `$${data.principal?.toFixed(2)}` }}</template>
    </Column>
    <Column header="Interés">
      <template #body="{ data }">{{ data.isRow0 ? '—' : `$${data.interest?.toFixed(2)}` }}</template>
    </Column>
    <Column v-for="chargeName in chargeNames" :key="chargeName" :header="chargeName">
      <template #body="{ data }">
        <template v-if="data.isRow0">—</template>
        <template v-else>${{ getChargeAmount(data, chargeName).toFixed(2) }}</template>
      </template>
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

const props = defineProps<{ schedule: any[]; loanAmount?: number }>();

const chargeNames = computed(() => {
  const names = new Set<string>();
  for (const row of props.schedule) {
    for (const c of row.additionalCharges ?? []) {
      names.add(c.name);
    }
  }
  return [...names];
});

function getChargeAmount(row: any, name: string): number {
  const charge = (row.additionalCharges ?? []).find((c: any) => c.name === name);
  return charge?.amount ?? 0;
}

const tableData = computed(() => {
  const row0 = {
    number: 0,
    totalPayment: 0,
    principal: 0,
    interest: 0,
    additionalCharges: [],
    balance: props.loanAmount ?? (props.schedule.length ? props.schedule[0].balance + props.schedule[0].principal : 0),
    isRow0: true,
  };
  return [row0, ...props.schedule];
});
</script>
