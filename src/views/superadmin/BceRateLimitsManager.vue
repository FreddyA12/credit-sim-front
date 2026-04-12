<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Límites de Tasas del BCE</h1>
      <Button label="Actualizar Límites" icon="pi pi-refresh" @click="showEditDialog(null)" />
    </div>

    <Message severity="info" :closable="false" class="mb-4">
      <span class="font-medium">Tasas referenciales del Banco Central del Ecuador.</span>
      Estas tasas definen los límites mínimos y máximos que las instituciones pueden ofrecer en cada rango de plazo.
    </Message>

    <DataTable :value="limits" :loading="loading" stripedRows>
      <Column header="Rango de Plazo (días)" :sortable="true">
        <template #body="{ data }">
          <span class="font-medium">{{ data.minDays }} - {{ data.maxDays || '∞' }} días</span>
        </template>
      </Column>
      <Column field="bceReferenceRate" header="Tasa Máxima BCE (%)" :sortable="true">
        <template #body="{ data }">
          <span class="font-semibold text-blue-600">{{ data.bceReferenceRate }}%</span>
        </template>
      </Column>
      <Column header="Rango Permitido">
        <template #body="{ data }">
          <span class="text-sm">
            Mín: <strong>{{ data.minAllowedRate }}%</strong> —
            Máx: <strong>{{ data.maxAllowedRate }}%</strong>
          </span>
        </template>
      </Column>
      <Column field="bceCircular" header="Circular BCE">
        <template #body="{ data }">
          <span class="text-xs text-gray-600">{{ data.bceCircular }}</span>
        </template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="data.active ? 'Activo' : 'Inactivo'" :severity="data.active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <Button icon="pi pi-pencil" size="small" severity="info" text rounded @click="showEditDialog(data)" v-tooltip.top="'Editar'" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog de edición -->
    <Dialog v-model:visible="editDialogVisible" modal :header="editingLimit ? 'Editar Límite' : 'Actualizar Todos los Límites'" :style="{ width: '600px' }">
      <div class="space-y-4">
        <div v-if="editingLimit">
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-sm font-medium block mb-2">Rango de Plazo</label>
              <InputText v-model="form.rangeName" class="w-full" disabled />
            </div>
            <div>
              <label class="text-sm font-medium block mb-2">Días</label>
              <InputText :value="`${form.minDays} - ${form.maxDays || '∞'}`" class="w-full" disabled />
            </div>
          </div>

          <div class="mb-4">
            <label class="text-sm font-medium block mb-2">Tasa Referencial BCE (%)</label>
            <InputNumber v-model="form.bceReferenceRate" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
          </div>

          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="text-sm font-medium block mb-2">Tasa Mínima Permitida (%)</label>
              <InputNumber v-model="form.minAllowedRate" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
            </div>
            <div>
              <label class="text-sm font-medium block mb-2">Tasa Máxima Permitida (%)</label>
              <InputNumber v-model="form.maxAllowedRate" :min="0" :max="100" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
            </div>
          </div>

          <div class="mb-4">
            <label class="text-sm font-medium block mb-2">Circular BCE</label>
            <InputText v-model="form.bceCircular" class="w-full" placeholder="Ej: Circular 250155 - 01-10-2025" />
          </div>

          <div class="flex items-center gap-2">
            <Checkbox v-model="form.active" inputId="active" :binary="true" />
            <label for="active" class="text-sm font-medium">Activo</label>
          </div>
        </div>

        <Message v-else severity="warn" :closable="false">
          Esta opción actualizará TODOS los límites del BCE. Asegúrate de tener la última circular del BCE.
        </Message>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" @click="editDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-check" @click="saveLimit" :loading="saving" />
      </template>
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
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import Message from 'primevue/message';
import api from '../../services/api';

const toast = useToast();
const limits = ref<any[]>([]);
const loading = ref(false);
const editDialogVisible = ref(false);
const editingLimit = ref<any>(null);
const saving = ref(false);

const form = ref({
  rangeName: '',
  minDays: 0,
  maxDays: null as number | null,
  bceReferenceRate: 0,
  minAllowedRate: 0,
  maxAllowedRate: 0,
  bceCircular: '',
  active: true,
});

async function loadLimits() {
  loading.value = true;
  try {
    const { data } = await api.get('/superadmin/bce-rate-limits');
    limits.value = data;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudieron cargar los límites', life: 4000 });
  } finally {
    loading.value = false;
  }
}

function showEditDialog(limit: any) {
  if (limit) {
    editingLimit.value = limit;
    form.value = { ...limit };
  } else {
    editingLimit.value = null;
    form.value = {
      rangeName: '',
      minDays: 0,
      maxDays: null,
      bceReferenceRate: 0,
      minAllowedRate: 0,
      maxAllowedRate: 0,
      bceCircular: '',
      active: true,
    };
  }
  editDialogVisible.value = true;
}

async function saveLimit() {
  if (editingLimit.value) {
    saving.value = true;
    try {
      await api.put(`/superadmin/bce-rate-limits/${editingLimit.value.id}`, form.value);
      toast.add({ severity: 'success', summary: 'Límite actualizado', life: 2000 });
      editDialogVisible.value = false;
      await loadLimits();
    } catch (error: any) {
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudo actualizar', life: 4000 });
    } finally {
      saving.value = false;
    }
  }
}

onMounted(() => {
  loadLimits();
});
</script>
