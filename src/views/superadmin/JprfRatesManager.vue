<template>
  <div>
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <header>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Regulación</p>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Tasas máximas JPRF</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          Límites legales de tasas activas efectivas máximas por segmento BCE.
          Ninguna institución puede superar estas tasas al configurar sus créditos.
        </p>
      </header>
    </div>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span class="font-medium text-slate-800">¿Cuándo actualizar?</span>
      Cuando el BCE publique nuevas resoluciones en
      <em>contenido.bce.fin.ec → Estadísticas → Tasas de Interés → Tasas Activas Efectivas Máximas</em>.
      Al guardar, los tipos de crédito nuevos quedarán sujetos al nuevo límite.
    </div>

    <Card class="border-slate-200 shadow-sm">
      <template #content>
        <DataTable :value="rates" :loading="loading" stripedRows>
          <Column field="segmentLabel" header="Segmento BCE" :sortable="true">
            <template #body="{ data }">
              <span class="font-medium">{{ data.segmentLabel }}</span>
            </template>
          </Column>
          <Column header="Tasa máxima vigente (%)" :sortable="true">
            <template #body="{ data }">
              <span class="font-semibold text-slate-900">{{ Number(data.maxRate).toFixed(2) }}%</span>
            </template>
          </Column>
          <Column field="legalSource" header="Fuente legal">
            <template #body="{ data }">
              <span class="text-xs text-slate-600">{{ data.legalSource }}</span>
            </template>
          </Column>
          <Column field="effectiveDate" header="Vigente desde">
            <template #body="{ data }">
              <span class="text-sm">{{ data.effectiveDate }}</span>
            </template>
          </Column>
          <Column header="Acciones">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                text
                rounded
                v-tooltip.top="'Editar'"
                @click="openEdit(data)"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Actualizar tasa máxima JPRF"
      :style="{ width: '520px' }"
    >
      <div v-if="editing" class="space-y-4">
        <div class="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p class="font-semibold text-slate-800">{{ editing.segmentLabel }}</p>
          <p class="mt-0.5 text-xs text-slate-500">
            Tasa actual: <strong>{{ Number(editing.maxRate).toFixed(2) }}%</strong>
          </p>
        </div>

        <div>
          <label class="text-sm font-medium block mb-2">Nueva tasa máxima (%)</label>
          <InputNumber
            v-model="form.maxRate"
            :min="0"
            :max="100"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            fluid
          />
        </div>

        <div>
          <label class="text-sm font-medium block mb-2">Número de resolución / Fuente legal</label>
          <InputText
            v-model="form.legalSource"
            class="w-full"
            placeholder="Ej: Resolución No. JPRF-F-2025-0010 de 01-ene-2025..."
          />
        </div>

        <div>
          <label class="text-sm font-medium block mb-2">Fecha de vigencia</label>
          <InputText
            v-model="form.effectiveDate"
            class="w-full"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
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

async function loadRates() {
  loading.value = true;
  try {
    const { data } = await api.get('/superadmin/jprf-rates');
    rates.value = data;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudieron cargar las tasas', life: 4000 });
  } finally {
    loading.value = false;
  }
}

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

onMounted(() => {
  loadRates();
});
</script>
