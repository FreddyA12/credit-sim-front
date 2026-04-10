<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Inversión</h1>
    <DataTable :value="applications" :loading="loading" stripedRows paginator :rows="10">
      <Column field="id" header="ID" :sortable="true" />
      <Column header="Inversor">
        <template #body="{ data }">{{ data.clientName }}</template>
      </Column>
      <Column header="Cédula">
        <template #body="{ data }">{{ data.idNumber }}</template>
      </Column>
      <Column header="Producto">
        <template #body="{ data }">{{ data.product?.name }}</template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">${{ Number(data.amount).toFixed(2) }}</template>
      </Column>
      <Column field="termDays" header="Plazo (días)" />
      <Column header="Interés bruto">
        <template #body="{ data }">${{ data.grossInterest?.toFixed(2) }}</template>
      </Column>
      <Column header="Retención IR">
        <template #body="{ data }">${{ data.irWithholding?.toFixed(2) }}</template>
      </Column>
      <Column header="Interés neto">
        <template #body="{ data }">${{ data.netInterest?.toFixed(2) }}</template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Select v-model="data.status" :options="statusOptions" optionLabel="label" optionValue="value" class="text-sm" @change="updateStatus(data)" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import api from '../../services/api';

const toast = useToast();
const applications = ref<any[]>([]);
const loading = ref(false);

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Activo', value: 'active' },
  { label: 'Vencido', value: 'matured' },
  { label: 'Cancelado', value: 'cancelled' },
];

function statusLabel(s: string) { return statusOptions.find((o) => o.value === s)?.label ?? s; }
function statusSeverity(s: string) {
  const map: Record<string, string> = { pending: 'warn', active: 'success', matured: 'info', cancelled: 'danger' };
  return map[s] ?? 'secondary';
}

onMounted(async () => {
  loading.value = true;
  const { data } = await api.get('/investment-applications');
  applications.value = data;
  loading.value = false;
});

async function updateStatus(app: any) {
  try {
    await api.put(`/investment-applications/${app.id}/status`, { status: app.status });
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar', life: 3000 });
  }
}
</script>
