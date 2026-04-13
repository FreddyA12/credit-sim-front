<template>
  <div>
    <div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <header>
        <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Regulación</p>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">Tasas Máximas JPRF</h1>
        <p class="mt-1 max-w-2xl text-sm text-slate-600">
          Límites de tasas de interés activas máximas por segmento crediticio según JPRF.
        </p>
      </header>
      <div class="flex gap-2 shrink-0">
        <Button label="Actualizar desde BCE" icon="pi pi-refresh" severity="secondary" @click="loadRates" />
        <Button label="Editar" icon="pi pi-pencil" @click="editAllDialog = true" />
      </div>
    </div>

    <div class="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
      <span class="font-medium text-slate-800">Resoluciones JPRF - Junta de Política y Regulación Financiera.</span>
      Tasas efectivas máximas vigentes para el sector financiero privado, público, popular y solidario.
      <a href="https://www.bce.fin.ec/storage/2026/03/TASAS-INTERES-ACTIVAS-EFECTIVAS-ABRIL-2026.pdf" target="_blank" class="ml-2 text-blue-600 hover:underline">
        Ver documento oficial BCE →
      </a>
    </div>

    <Card class="border-slate-200 shadow-sm">
      <template #content>
        <DataTable :value="rates" :loading="loading" stripedRows paginator :rows="10">
          <Column field="segmentLabel" header="Segmento de Crédito" :sortable="true" />
          <Column header="Tasa Máxima (%)">
            <template #body="{ data }">
              <span class="font-semibold text-slate-900 text-lg">{{ formatNumber(data.maxRate) }}%</span>
            </template>
          </Column>
          <Column header="Última actualización">
            <template #body="{ data }">
              <div class="text-sm">
                <p class="font-medium">{{ new Date(data.effectiveDate).toLocaleDateString('es-EC') }}</p>
                <p class="text-xs text-slate-500 mt-0.5">{{ data.legalSource.split(' —')[0] }}</p>
              </div>
            </template>
          </Column>
          <Column header="Acciones" style="width: 100px">
            <template #body="{ data }">
              <Button
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                text
                rounded
                @click="editRate(data)"
                v-tooltip.top="'Editar'"
              />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Dialog para editar una tasa -->
    <Dialog v-model:visible="editDialogVisible" modal header="Editar Tasa Máxima" :style="{ width: '500px' }">
      <div v-if="editingRate" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Segmento</label>
          <InputText v-model="editingRate.segmentLabel" disabled class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Tasa Máxima (%) *</label>
          <InputNumber
            v-model="editingRate.maxRate"
            :min="0"
            :max="100"
            :minFractionDigits="2"
            :maxFractionDigits="2"
            mode="decimal"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Fecha Efectiva (YYYY-MM-DD) *</label>
          <InputText v-model="editingRate.effectiveDate" type="date" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Fuente Legal (Resolución) *</label>
          <Textarea
            v-model="editingRate.legalSource"
            :autoResize="true"
            rows="4"
            class="w-full"
            placeholder="Ej: Resolución No. JPRF-F-2024-0104 de 15-mar-2024 — Junta de Política y Regulación Financiera del Ecuador"
          />
        </div>

        <div class="flex gap-3 justify-end">
          <Button label="Cancelar" severity="secondary" @click="editDialogVisible = false" />
          <Button label="Guardar" @click="saveRate" :loading="saving" />
        </div>
      </div>
    </Dialog>

    <!-- Dialog para editar masivamente (futuro) -->
    <Dialog v-model:visible="editAllDialog" modal header="Actualizar Tasas Máximas" :style="{ width: '600px' }">
      <div class="space-y-4">
        <p class="text-sm text-slate-600">
          Actualice todas las tasas en función de la última resolución del BCE. Pegue los datos en formato tabla.
        </p>
        <Textarea
          v-model="bulkInput"
          :autoResize="true"
          rows="10"
          class="w-full"
          placeholder="Segmento | Tasa (%)&#10;Consumo | 16.77&#10;Educativo | 9.50&#10;..."
        />
        <div class="flex gap-3 justify-end">
          <Button label="Cancelar" severity="secondary" @click="editAllDialog = false" />
          <Button label="Procesar" @click="processBulkUpdate" :disabled="!bulkInput.trim()" />
        </div>
      </div>
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
import Textarea from 'primevue/textarea';
import { formatNumber } from '../../utils/number-utils';
import api from '../../services/api';

const toast = useToast();
const rates = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const editDialogVisible = ref(false);
const editAllDialog = ref(false);
const editingRate = ref<any>(null);
const bulkInput = ref('');

async function loadRates() {
  loading.value = true;
  try {
    const { data } = await api.get('/superadmin/jprf-rates');
    rates.value = data.map((r: any) => ({ ...r }));
    toast.add({ severity: 'success', summary: 'Tasas cargadas', life: 2000 });
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.message || 'No se pudieron cargar las tasas',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
}

function editRate(rate: any) {
  editingRate.value = { ...rate };
  editDialogVisible.value = true;
}

async function saveRate() {
  if (!editingRate.value?.maxRate || !editingRate.value?.effectiveDate || !editingRate.value?.legalSource) {
    toast.add({ severity: 'warn', summary: 'Complete todos los campos', life: 3000 });
    return;
  }

  saving.value = true;
  try {
    const response = await api.put(`/superadmin/jprf-rates/${editingRate.value.segment}`, {
      maxRate: editingRate.value.maxRate,
      effectiveDate: editingRate.value.effectiveDate,
      legalSource: editingRate.value.legalSource,
    });

    // Actualizar en tabla
    const idx = rates.value.findIndex((r) => r.segment === editingRate.value.segment);
    if (idx >= 0) {
      rates.value[idx] = response.data;
    }

    toast.add({ severity: 'success', summary: 'Tasa actualizada', life: 2000 });
    editDialogVisible.value = false;
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.message || 'No se pudo actualizar',
      life: 4000,
    });
  } finally {
    saving.value = false;
  }
}

function processBulkUpdate() {
  // Parsear líneas y actualizar tasas
  const lines = bulkInput.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'));

  let count = 0;
  for (const line of lines) {
    const parts = line.split('|').map((p) => p.trim());
    if (parts.length >= 2) {
      const label = parts[0];
      const rateStr = parts[1];
      const rate = parseFloat(rateStr);

      const r = rates.value.find((r) => r.segmentLabel.toLowerCase() === label.toLowerCase());
      if (r && !isNaN(rate)) {
        r.maxRate = rate;
        count++;
      }
    }
  }

  toast.add({ severity: 'info', summary: `${count} tasas procesadas. Guarde manualmente.`, life: 3000 });
  bulkInput.value = '';
  editAllDialog.value = false;
}

onMounted(() => loadRates());
</script>
