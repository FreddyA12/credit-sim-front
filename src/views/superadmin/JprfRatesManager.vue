<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Tasas Máximas JPRF</h1>
      <p class="text-sm text-gray-500 mt-1">
        Actualiza estas tasas cada vez que el Banco Central del Ecuador publique una nueva resolución.
        Ninguna institución podrá configurar una tasa superior al límite aquí establecido.
      </p>
    </div>

    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
      <i class="pi pi-exclamation-triangle text-amber-500 mt-0.5" />
      <div class="text-sm text-amber-800">
        <strong>¿Cuándo actualizar?</strong> Cuando el BCE publique nuevas tasas en
        <em>contenido.bce.fin.ec → Estadísticas → Tasas de Interés → Tasas Activas Efectivas Máximas</em>.
        Al guardar, todos los tipos de crédito nuevos quedarán sujetos al nuevo límite.
      </div>
    </div>

    <DataTable :value="rates" :loading="loading" stripedRows class="text-sm">
      <Column field="segmentLabel" header="Segmento BCE" />
      <Column header="Tasa máxima vigente">
        <template #body="{ data }">
          <span class="font-semibold text-red-600">{{ Number(data.maxRate).toFixed(2) }}%</span>
        </template>
      </Column>
      <Column field="legalSource" header="Fuente legal" class="text-xs text-gray-500" />
      <Column field="effectiveDate" header="Vigente desde" />
      <Column header="Actualizar">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" severity="warning" text rounded size="small" @click="openEdit(data)" />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" header="Actualizar tasa máxima JPRF" modal class="w-full max-w-lg">
      <div v-if="editing" class="flex flex-col gap-4 pt-2">
        <div class="bg-gray-50 rounded p-3 text-sm">
          <p class="font-semibold text-gray-700">{{ editing.segmentLabel }}</p>
          <p class="text-gray-500 text-xs mt-1">Tasa actual: <strong>{{ Number(editing.maxRate).toFixed(2) }}%</strong></p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Nueva tasa máxima (%)</label>
          <InputNumber v-model="form.maxRate" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Número de resolución / Fuente legal</label>
          <InputText v-model="form.legalSource" class="w-full text-sm" placeholder="Ej: Resolución No. JPRF-F-2025-0010 de 01-ene-2025..." />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Fecha de vigencia</label>
          <InputText v-model="form.effectiveDate" class="w-full" placeholder="YYYY-MM-DD" />
        </div>

        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
          <Button label="Guardar" :loading="saving" @click="save" />
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
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import api from '../../services/api';

const toast = useToast();
const loading = ref(false);
const saving = ref(false);
const rates = ref<any[]>([]);
const dialogVisible = ref(false);
const editing = ref<any>(null);
const form = ref({ maxRate: 0, legalSource: '', effectiveDate: '' });

onMounted(async () => {
  loading.value = true;
  const { data } = await api.get('/superadmin/jprf-rates');
  rates.value = data;
  loading.value = false;
});

function openEdit(rate: any) {
  editing.value = rate;
  form.value = {
    maxRate: Number(rate.maxRate),
    legalSource: rate.legalSource,
    effectiveDate: rate.effectiveDate,
  };
  dialogVisible.value = true;
}

async function save() {
  saving.value = true;
  try {
    const { data } = await api.put(`/superadmin/jprf-rates/${editing.value.segment}`, form.value);
    const idx = rates.value.findIndex((r) => r.segment === editing.value.segment);
    if (idx !== -1) rates.value[idx] = data;
    toast.add({ severity: 'success', summary: 'Tasa actualizada', detail: `${editing.value.segmentLabel}: ${form.value.maxRate}%`, life: 3000 });
    dialogVisible.value = false;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message ?? 'No se pudo guardar', life: 4000 });
  } finally {
    saving.value = false;
  }
}
</script>
