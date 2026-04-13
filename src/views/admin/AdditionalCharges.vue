<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="$router.back()" />
      <h1 class="text-2xl font-bold text-gray-800">Cobros Adicionales — {{ creditTypeName }}</h1>
      <Button label="Agregar cobro" icon="pi pi-plus" class="ml-auto" @click="openDialog()" />
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
      <p class="font-semibold mb-1"><i class="pi pi-info-circle mr-1"></i>Cobros regulados por ley</p>
      <ul class="list-disc ml-5 space-y-1">
        <li><strong>SOLCA (0.5%)</strong> se calcula automáticamente al desembolso para todos los créditos (COMF Disposición General 14ª). No necesita configurarse aquí.</li>
        <li v-if="isMortgageSegment"><strong>Seguro de Desgravamen</strong> y <strong>Seguro de Incendio y Terremoto</strong> son obligatorios para este segmento y se crean automáticamente. Solo puede modificar la tasa.</li>
        <li v-else><strong>Seguro de Desgravamen</strong> es opcional para este segmento. El <strong>Seguro de Incendio y Terremoto</strong> no aplica a este tipo de crédito.</li>
      </ul>
    </div>

    <DataTable :value="charges" :loading="loading" stripedRows>
      <Column field="name" header="Nombre" />
      <Column header="Tipo">
        <template #body="{ data }">{{ chargeTypeLabel(data.chargeType) }}</template>
      </Column>
      <Column header="Valor">
        <template #body="{ data }">
          {{ data.valueType === 'percentage' ? `${data.value}%` : `$${data.value}` }}
        </template>
      </Column>
      <Column header="Momento">
        <template #body="{ data }">{{ data.timing === 'disbursement' ? 'Al desembolso' : 'Por cuota' }}</template>
      </Column>
      <Column header="Base de cálculo">
        <template #body="{ data }">{{ calcBaseLabel(data.calculationBase) }}</template>
      </Column>
      <Column header="Obligatorio">
        <template #body="{ data }">
          <Tag :value="data.mandatory ? 'Sí' : 'No'" :severity="data.mandatory ? 'warn' : 'secondary'" />
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openDialog(data)" />
            <Button v-if="!isLockedCharge(data)" icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Editar Cobro' : 'Nuevo Cobro'" modal class="w-full max-w-xl">
      <form @submit.prevent="save" class="grid grid-cols-2 gap-4 pt-2">
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nombre</label>
          <InputText v-model="form.name" class="w-full" :disabled="isInsuranceType" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo de cobro</label>
          <Select v-model="form.chargeType" :options="availableChargeTypes" optionLabel="label" optionValue="value" :disabled="!!editingId" @change="onChargeTypeChange" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo de valor</label>
          <Select v-model="form.valueType" :options="[{label:'Porcentaje',value:'percentage'},{label:'Monto fijo',value:'fixed_amount'}]" optionLabel="label" optionValue="value" :disabled="isInsuranceType" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Valor (tasa %)</label>
          <InputNumber v-model="form.value" :minFractionDigits="4" :min="0" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Momento de cobro</label>
          <Select v-model="form.timing" :options="[{label:'Al desembolso',value:'disbursement'},{label:'Por cuota',value:'per_installment'}]" optionLabel="label" optionValue="value" :disabled="isInsuranceType" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Base de cálculo</label>
          <Select v-model="form.calculationBase" :options="[{label:'Capital inicial',value:'initial_capital'},{label:'Saldo vigente',value:'outstanding_balance'},{label:'Monto fijo',value:'fixed'}]" optionLabel="label" optionValue="value" :disabled="isInsuranceType" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.mandatory" :binary="true" :disabled="isInsuranceType" />
          <label class="text-sm">Obligatorio</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.active" :binary="true" />
          <label class="text-sm">Activo</label>
        </div>

        <div v-if="isInsuranceType" class="col-span-2 bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
          <i class="pi pi-lock mr-1"></i>
          <span v-if="form.chargeType === 'life_insurance'">Seguro de Desgravamen: por normativa se cobra por cuota sobre saldo vigente (Art. 210 COMF). Solo puede modificar la tasa.</span>
          <span v-else>Seguro de Incendio y Terremoto: por normativa se cobra por cuota sobre saldo vigente (Art. 308 COMF). Solo puede modificar la tasa.</span>
        </div>

        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nota legal</label>
          <Textarea v-model="form.legalNote" rows="3" class="w-full" />
        </div>
        <div class="col-span-2 flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" @click="dialogVisible = false" />
          <Button type="submit" label="Guardar" :loading="saving" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';
import Tag from 'primevue/tag';
import api from '../../services/api';

const route = useRoute();
const toast = useToast();
const confirm = useConfirm();
const creditTypeId = route.params.id as string;
const creditTypeName = ref('');
const creditTypeBceSegment = ref('');
const charges = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);

const MORTGAGE_SEGMENTS = [
  'vivienda_interes_social',
  'vivienda_interes_publico',
  'inmobiliario',
];

const isMortgageSegment = computed(() => MORTGAGE_SEGMENTS.includes(creditTypeBceSegment.value));

const allChargeTypes = [
  { label: 'Seguro de Desgravamen', value: 'life_insurance' },
  { label: 'Seguro de Incendio y Terremoto', value: 'fire_earthquake' },
  { label: 'Otro', value: 'other' },
];

const availableChargeTypes = computed(() => {
  if (isMortgageSegment.value) return allChargeTypes;
  return allChargeTypes.filter((t) => t.value !== 'fire_earthquake');
});

const isInsuranceType = computed(() =>
  form.value.chargeType === 'life_insurance' || form.value.chargeType === 'fire_earthquake',
);

function chargeTypeLabel(type: string) {
  const map: Record<string, string> = {
    life_insurance: 'Seguro de Desgravamen',
    fire_earthquake: 'Seguro Incendio/Terremoto',
    solca: 'SOLCA',
    other: 'Otro',
  };
  return map[type] || type;
}

function calcBaseLabel(base: string) {
  const map: Record<string, string> = {
    initial_capital: 'Capital inicial',
    outstanding_balance: 'Saldo vigente',
    fixed: 'Monto fijo',
  };
  return map[base] || base;
}

function isLockedCharge(data: any) {
  return (data.chargeType === 'life_insurance' || data.chargeType === 'fire_earthquake') && data.mandatory;
}

const emptyForm = () => ({
  name: '',
  chargeType: 'other',
  valueType: 'percentage',
  value: 0,
  timing: 'disbursement',
  calculationBase: 'initial_capital',
  mandatory: false,
  legalNote: '',
  active: true,
});
const form = ref(emptyForm());

function onChargeTypeChange() {
  if (form.value.chargeType === 'life_insurance') {
    form.value.name = 'Seguro de Desgravamen';
    form.value.timing = 'per_installment';
    form.value.calculationBase = 'outstanding_balance';
    form.value.valueType = 'percentage';
    form.value.mandatory = true;
    form.value.value = 0.0499;
    form.value.legalNote = 'Circular SB-IG-2024-0034-C, Cap. XXV JPRF, Art. 210 COMF — 0.0499% mensual sobre saldo.';
  } else if (form.value.chargeType === 'fire_earthquake') {
    form.value.name = 'Seguro de Incendio y Terremoto';
    form.value.timing = 'per_installment';
    form.value.calculationBase = 'outstanding_balance';
    form.value.valueType = 'percentage';
    form.value.mandatory = true;
    form.value.value = 0.03;
    form.value.legalNote = 'Art. 308 COMF, Art. 68 LGS — Prima mensual sobre saldo asegurado.';
  }
}

onMounted(async () => {
  loading.value = true;
  const [typeRes, chargesRes] = await Promise.all([
    api.get(`/credit-types/${creditTypeId}`),
    api.get(`/credit-types/${creditTypeId}/charges`),
  ]);
  creditTypeName.value = typeRes.data.name;
  creditTypeBceSegment.value = typeRes.data.bceSegment || '';
  charges.value = chargesRes.data;
  loading.value = false;
});

function openDialog(data?: any) {
  form.value = data ? { ...data } : emptyForm();
  editingId.value = data?.id ?? null;
  dialogVisible.value = true;
}

async function save() {
  saving.value = true;
  try {
    if (editingId.value) {
      const { data } = await api.put(`/charges/${editingId.value}`, form.value);
      const idx = charges.value.findIndex((c) => c.id === editingId.value);
      if (idx !== -1) charges.value[idx] = data;
    } else {
      const { data } = await api.post(`/credit-types/${creditTypeId}/charges`, form.value);
      charges.value.push(data);
    }
    toast.add({ severity: 'success', summary: 'Guardado', life: 3000 });
    dialogVisible.value = false;
  } catch (e: any) {
    const msg = e.response?.data?.message;
    toast.add({ severity: 'error', summary: 'Error al guardar', detail: Array.isArray(msg) ? msg.join(', ') : msg, life: 5000 });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(data: any) {
  confirm.require({
    message: `¿Eliminar el cobro "${data.name}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await api.delete(`/charges/${data.id}`);
      charges.value = charges.value.filter((c) => c.id !== data.id);
      toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 });
    },
  });
}
</script>
