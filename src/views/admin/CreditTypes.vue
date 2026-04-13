<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Tipos de Crédito</h1>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <ToggleSwitch v-model="showInactive" />
          <label class="text-sm text-gray-500">Mostrar inactivos</label>
        </div>
        <Button label="Nuevo tipo" icon="pi pi-plus" @click="openDialog()" />
      </div>
    </div>

    <DataTable :value="filteredTypes" :loading="loading" stripedRows>
      <Column field="name" header="Nombre" />
      <Column header="Segmento BCE">
        <template #body="{ data }">{{ segmentLabel(data.bceSegment) }}</template>
      </Column>
      <Column header="Tasa anual">
        <template #body="{ data }">{{ data.annualRate }}%</template>
      </Column>
      <Column header="Tasa máx. JPRF">
        <template #body="{ data }">{{ data.maxJprfRate }}%</template>
      </Column>
      <Column header="Activo">
        <template #body="{ data }">
          <Tag :value="data.active ? 'Activo' : 'Inactivo'" :severity="data.active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openDialog(data)" />
            <RouterLink :to="`/admin/credit-types/${data.id}/charges`">
              <Button icon="pi pi-list" severity="info" text rounded v-tooltip="'Cobros adicionales'" />
            </RouterLink>
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Editar Tipo de Crédito' : 'Nuevo Tipo de Crédito'" modal class="w-full max-w-2xl">
      <form @submit.prevent="save" class="grid grid-cols-2 gap-4 pt-2">
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nombre</label>
          <InputText v-model="form.name" class="w-full" />
          <span v-if="formErrors.name" class="text-xs text-red-600">{{ formErrors.name }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Segmento BCE</label>
          <Select v-model="form.bceSegment" :options="segmentOptions" optionLabel="label" optionValue="value" />
          <span v-if="formErrors.bceSegment" class="text-xs text-red-600">{{ formErrors.bceSegment }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tasa anual (%)</label>
          <InputNumber v-model="form.annualRate" :min="0" :max="100" :minFractionDigits="2" fluid />
          <span v-if="formErrors.annualRate" class="text-xs text-red-600">{{ formErrors.annualRate }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tasa máx. JPRF (%)</label>
          <InputNumber v-model="form.maxJprfRate" :minFractionDigits="2" fluid disabled />
          <span v-if="form.bceSegment && jprfRates[form.bceSegment]" class="text-xs text-slate-500">
            {{ jprfRates[form.bceSegment].legalSource }}
          </span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Monto mínimo (USD)</label>
          <InputNumber v-model="form.minAmount" :min="0" fluid />
          <span v-if="formErrors.minAmount" class="text-xs text-red-600">{{ formErrors.minAmount }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Monto máximo (USD)</label>
          <InputNumber v-model="form.maxAmount" :min="0" fluid />
          <span v-if="formErrors.maxAmount" class="text-xs text-red-600">{{ formErrors.maxAmount }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Plazo mínimo (meses)</label>
          <InputNumber v-model="form.minTermMonths" :min="1" fluid />
          <span v-if="formErrors.minTermMonths" class="text-xs text-red-600">{{ formErrors.minTermMonths }}</span>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Plazo máximo (meses)</label>
          <InputNumber v-model="form.maxTermMonths" :min="1" fluid />
          <span v-if="formErrors.maxTermMonths" class="text-xs text-red-600">{{ formErrors.maxTermMonths }}</span>
        </div>
        <div class="col-span-2 flex items-center gap-2">
          <Checkbox v-model="form.active" :binary="true" />
          <label class="text-sm">Activo</label>
        </div>
        <div class="col-span-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
          <Button type="submit" label="Guardar" :loading="saving" :disabled="hasErrors" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import { useCreditStore } from '../../stores/credit.store';
import api from '../../services/api';

type JprfRateEntry = { maxRate: number; segmentLabel: string; legalSource: string };

const toast = useToast();
const confirm = useConfirm();
const creditStore = useCreditStore();
const { creditTypes } = storeToRefs(creditStore);
const loading = ref(false);
const showInactive = ref(false);
const filteredTypes = computed(() =>
  showInactive.value ? creditTypes.value : creditTypes.value.filter((t) => t.active),
);
const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);

const jprfRates = ref<Record<string, JprfRateEntry>>({});

async function loadJprfRates() {
  const { data } = await api.get('/public/jprf-rates');
  jprfRates.value = Object.fromEntries(
    data.map((r: any) => [r.segment, { maxRate: Number(r.maxRate), segmentLabel: r.segmentLabel, legalSource: r.legalSource }]),
  );
}

const segmentOptions = computed(() =>
  Object.entries(jprfRates.value).map(([value, r]) => ({ label: r.segmentLabel, value })),
);

function segmentLabel(value: string) {
  return jprfRates.value[value]?.segmentLabel ?? value;
}

const emptyForm = () => ({ name: '', bceSegment: 'consumo', annualRate: 0, maxJprfRate: 0, minAmount: 0, maxAmount: 0, minTermMonths: 1, maxTermMonths: 60, active: true });
const form = ref(emptyForm());

const formErrors = computed(() => {
  const errors: Record<string, string | null> = {};
  const f = form.value;

  errors.name = !f.name?.trim() ? 'El nombre es obligatorio' : null;
  errors.bceSegment = !f.bceSegment ? 'Seleccione un segmento' : null;

  const maxJprf = jprfRates.value[f.bceSegment]?.maxRate;
  if (f.annualRate == null || f.annualRate <= 0) {
    errors.annualRate = 'La tasa debe ser mayor a 0';
  } else if (maxJprf !== undefined && f.annualRate > maxJprf) {
    errors.annualRate = `Supera el máximo JPRF permitido (${maxJprf}%)`;
  } else {
    errors.annualRate = null;
  }

  errors.minAmount = f.minAmount == null || f.minAmount <= 0 ? 'El monto mínimo debe ser mayor a 0' : null;
  errors.maxAmount = f.maxAmount == null || f.maxAmount <= 0
    ? 'El monto máximo debe ser mayor a 0'
    : f.minAmount != null && f.maxAmount < f.minAmount
      ? 'Debe ser mayor o igual al monto mínimo'
      : null;

  errors.minTermMonths = f.minTermMonths == null || f.minTermMonths < 1 ? 'El plazo mínimo debe ser al menos 1' : null;
  errors.maxTermMonths = f.maxTermMonths == null || f.maxTermMonths < 1
    ? 'El plazo máximo debe ser al menos 1'
    : f.minTermMonths != null && f.maxTermMonths < f.minTermMonths
      ? 'Debe ser mayor o igual al plazo mínimo'
      : null;

  return errors;
});

const hasErrors = computed(() => Object.values(formErrors.value).some((e) => e !== null));

watch(() => form.value.bceSegment, (segment) => {
  if (segment && jprfRates.value[segment]) {
    form.value.maxJprfRate = jprfRates.value[segment].maxRate;
  }
});

onMounted(async () => {
  loading.value = true;
  await Promise.all([creditStore.fetchTypes(), loadJprfRates()]);
  loading.value = false;
});

function openDialog(data?: any) {
  const base = data ? { ...data } : emptyForm();
  if (base.bceSegment && jprfRates.value[base.bceSegment]) {
    base.maxJprfRate = jprfRates.value[base.bceSegment].maxRate;
  }
  form.value = base;
  editingId.value = data?.id ?? null;
  dialogVisible.value = true;
}

async function save() {
  if (hasErrors.value) {
    const firstError = Object.values(formErrors.value).find((e) => e !== null);
    toast.add({ severity: 'warn', summary: 'Formulario inválido', detail: firstError!, life: 4000 });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await creditStore.updateType(editingId.value, form.value);
    } else {
      await creditStore.createType(form.value);
    }
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 });
    dialogVisible.value = false;
  } catch (e: any) {
    const detail = e?.response?.data?.message || 'Error al guardar';
    toast.add({ severity: 'error', summary: 'Error', detail, life: 5000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(data: any) {
  confirm.require({
    message: `¿Eliminar el tipo "${data.name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await creditStore.deleteType(data.id);
      toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 });
    },
  });
}
</script>
