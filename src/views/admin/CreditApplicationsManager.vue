<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Crédito</h1>
    <DataTable :value="applications" :loading="loading" stripedRows paginator :rows="10">
      <Column field="id" header="ID" :sortable="true" />
      <Column header="Solicitante">
        <template #body="{ data }">{{ data.clientName }}</template>
      </Column>
      <Column header="Cédula">
        <template #body="{ data }">{{ data.idNumber }}</template>
      </Column>
      <Column header="Tipo de crédito">
        <template #body="{ data }">{{ data.creditType?.name }}</template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">${{ Number(data.amount).toFixed(2) }}</template>
      </Column>
      <Column field="termMonths" header="Plazo (meses)" />
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Biométrico">
        <template #body="{ data }">
          <Tag :value="data.biometricsValidated ? 'Verificado' : 'Pendiente'" :severity="data.biometricsValidated ? 'success' : 'warn'" />
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" severity="info" text rounded @click="openDetail(data)" />
            <Select v-model="data.status" :options="statusOptions" optionLabel="label" optionValue="value" class="text-sm" @change="updateStatus(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="detailVisible" header="Detalle de Solicitud" modal class="w-full max-w-2xl">
      <div v-if="selected" class="grid grid-cols-2 gap-3 text-sm">
        <div><span class="font-medium">Solicitante:</span> {{ selected.clientName }}</div>
        <div><span class="font-medium">Cédula:</span> {{ selected.idNumber }}</div>
        <div><span class="font-medium">Email:</span> {{ selected.clientEmail || '—' }}</div>
        <div><span class="font-medium">Teléfono:</span> {{ selected.clientPhone || '—' }}</div>
        <div><span class="font-medium">Tipo:</span> {{ selected.creditType?.name }}</div>
        <div><span class="font-medium">Monto:</span> ${{ Number(selected.amount).toFixed(2) }}</div>
        <div><span class="font-medium">Plazo:</span> {{ selected.termMonths }} meses</div>
        <div><span class="font-medium">Tasa aplicada:</span> {{ selected.appliedRate }}%</div>
        <div><span class="font-medium">Amortización:</span> {{ selected.amortizationSystem }}</div>
        <div><span class="font-medium">Ingresos:</span> ${{ selected.monthlyIncome || '—' }}</div>
        <div class="col-span-2">
          <span class="font-medium">Documentos:</span>
          <ul class="mt-1">
            <li v-for="doc in selected.documents" :key="doc.id">
              <a :href="doc.fileUrl" target="_blank" class="text-blue-600 hover:underline">{{ doc.documentType }}</a>
            </li>
          </ul>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import api from '../../services/api';

const toast = useToast();
const applications = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const selected = ref<any>(null);

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En revisión', value: 'in_review' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Rechazado', value: 'rejected' },
  { label: 'Desembolsado', value: 'disbursed' },
];

function statusLabel(s: string) {
  return statusOptions.find((o) => o.value === s)?.label ?? s;
}

function statusSeverity(s: string) {
  const map: Record<string, string> = { pending: 'warn', in_review: 'info', approved: 'success', rejected: 'danger', disbursed: 'success' };
  return map[s] ?? 'secondary';
}

onMounted(async () => {
  loading.value = true;
  const { data } = await api.get('/credit-applications');
  applications.value = data;
  loading.value = false;
});

function openDetail(data: any) {
  selected.value = data;
  detailVisible.value = true;
}

async function updateStatus(app: any) {
  try {
    await api.put(`/credit-applications/${app.id}/status`, { status: app.status });
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar estado', life: 3000 });
  }
}
</script>
