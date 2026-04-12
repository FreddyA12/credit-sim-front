<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Productos de Inversión</h1>
      <Button label="Nuevo producto" icon="pi pi-plus" @click="openDialog()" />
    </div>

    <DataTable :value="products" :loading="loading" stripedRows>
      <Column field="name" header="Nombre" />
      <Column header="Plazo (días)">
        <template #body="{ data }">{{ data.minTermDays }} — {{ data.maxTermDays }}</template>
      </Column>
      <Column header="Monto mínimo">
        <template #body="{ data }">${{ data.minAmount }}</template>
      </Column>
      <Column header="Tasa anual">
        <template #body="{ data }">{{ data.annualRate }}%</template>
      </Column>
      <Column field="paymentFrequency" header="Frecuencia de pago" />
      <Column header="Renovación auto.">
        <template #body="{ data }">
          <Tag :value="data.autoRenew ? 'Sí' : 'No'" :severity="data.autoRenew ? 'info' : 'secondary'" />
        </template>
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
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" :header="editingId ? 'Editar Producto' : 'Nuevo Producto de Inversión'" modal class="w-full max-w-xl">
      <form @submit.prevent="save" class="grid grid-cols-2 gap-4 pt-2">
        <div class="flex flex-col gap-1 col-span-2">
          <label class="text-sm font-medium">Nombre</label>
          <InputText v-model="form.name" class="w-full" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Plazo mínimo (días)</label>
          <InputNumber v-model="form.minTermDays" :min="1" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Plazo máximo (días)</label>
          <InputNumber v-model="form.maxTermDays" :min="1" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Monto mínimo (USD)</label>
          <InputNumber v-model="form.minAmount" :min="0" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Monto máximo (USD)</label>
          <InputNumber v-model="form.maxAmount" :min="0" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tasa anual (%)</label>
          <InputNumber v-model="form.annualRate" :minFractionDigits="2" :min="0" :max="100" fluid />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Frecuencia de pago</label>
          <Select v-model="form.paymentFrequency" :options="freqOptions" optionLabel="label" optionValue="value" />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.autoRenew" :binary="true" />
          <label class="text-sm">Renovación automática</label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="form.active" :binary="true" />
          <label class="text-sm">Activo</label>
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
import Tag from 'primevue/tag';
import api from '../../services/api';

const toast = useToast();
const confirm = useConfirm();
const products = ref<any[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);

const freqOptions = [
  { label: 'Al vencimiento', value: 'at_maturity' },
  { label: 'Mensual', value: 'monthly' },
  { label: 'Trimestral', value: 'quarterly' },
];

const emptyForm = () => ({ name: '', minTermDays: 30, maxTermDays: 360, minAmount: 500, maxAmount: null as any, annualRate: 0, paymentFrequency: 'at_maturity', autoRenew: false, active: true });
const form = ref(emptyForm());

onMounted(async () => {
  loading.value = true;
  const { data } = await api.get('/investment-products');
  products.value = data;
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
      const { data } = await api.put(`/investment-products/${editingId.value}`, form.value);
      const idx = products.value.findIndex((p) => p.id === editingId.value);
      if (idx !== -1) products.value[idx] = data;
    } else {
      const { data } = await api.post('/investment-products', form.value);
      products.value.push(data);
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
    message: `¿Eliminar el producto "${data.name}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await api.delete(`/investment-products/${data.id}`);
      products.value = products.value.filter((p) => p.id !== data.id);
      toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 });
    },
  });
}
</script>
