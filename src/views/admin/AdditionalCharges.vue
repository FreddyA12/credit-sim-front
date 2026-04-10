<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <Button icon="pi pi-arrow-left" severity="secondary" text @click="$router.back()" />
      <h1 class="text-2xl font-bold text-gray-800">Cobros Adicionales — {{ creditTypeName }}</h1>
      <Button label="Agregar cobro" icon="pi pi-plus" class="ml-auto" @click="openDialog()" />
    </div>

    <DataTable :value="charges" :loading="loading" stripedRows>
      <Column field="name" header="Nombre" />
      <Column field="chargeType" header="Tipo" />
      <Column header="Valor">
        <template #body="{ data }">
          {{ data.valueType === 'percentage' ? `${data.value}%` : `$${data.value}` }}
        </template>
      </Column>
      <Column field="timing" header="Momento" />
      <Column field="calculationBase" header="Base de cálculo" />
      <Column header="Obligatorio">
        <template #body="{ data }">
          <Tag :value="data.mandatory ? 'Sí' : 'No'" :severity="data.mandatory ? 'warn' : 'secondary'" />
        </template>
      </Column>
      <Column header="Nota legal">
        <template #body="{ data }">
          <span class="text-xs text-gray-500 line-clamp-2">{{ data.legalNote }}</span>
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openDialog(data)" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Editar Cobro' : 'Nuevo Cobro'" modal class="w-full max-w-xl">
      <form @submit.prevent="save" class="grid grid-cols-2 gap-4 pt-2">
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nombre</label>
          <InputText v-model="form.name" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo de cobro</label>
          <Select v-model="form.chargeType" :options="chargeTypeOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tipo de valor</label>
          <Select v-model="form.valueType" :options="[{label:'Porcentaje',value:'percentage'},{label:'Monto fijo',value:'fixed_amount'}]" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Valor</label>
          <InputNumber v-model="form.value" :minFractionDigits="4" :min="0" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Momento de cobro</label>
          <Select v-model="form.timing" :options="[{label:'Al desembolso',value:'disbursement'},{label:'Por cuota',value:'per_installment'}]" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Base de cálculo</label>
          <Select v-model="form.calculationBase" :options="[{label:'Capital inicial',value:'initial_capital'},{label:'Saldo vigente',value:'outstanding_balance'},{label:'Monto fijo',value:'fixed'}]" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.mandatory" :binary="true" />
          <label class="text-sm">Obligatorio</label>
        </div>
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nota legal</label>
          <Textarea v-model="form.legalNote" rows="3" />
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
import { ref, onMounted } from 'vue';
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
const creditTypeId = Number(route.params.id);
const creditTypeName = ref('');
const charges = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<number | null>(null);

const chargeTypeOptions = [
  { label: 'Desgravamen', value: 'desgravamen' },
  { label: 'Incendio y Terremoto', value: 'incendio_terremoto' },
  { label: 'SOLCA', value: 'solca' },
  { label: 'Otro', value: 'other' },
];

const emptyForm = () => ({ name: '', chargeType: 'other', valueType: 'percentage', value: 0, timing: 'disbursement', calculationBase: 'initial_capital', mandatory: false, legalNote: '', active: true });
const form = ref(emptyForm());

onMounted(async () => {
  loading.value = true;
  const [typeRes, chargesRes] = await Promise.all([
    api.get(`/credit-types/${creditTypeId}`),
    api.get(`/credit-types/${creditTypeId}/charges`),
  ]);
  creditTypeName.value = typeRes.data.name;
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
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar', life: 3000 });
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
