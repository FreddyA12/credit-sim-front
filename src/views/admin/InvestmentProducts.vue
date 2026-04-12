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
      <Column header="Frecuencia de pago">
        <template #body="{ data }">{{ paymentFrequencyLabel(data.paymentFrequency) }}</template>
      </Column>
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
            <Button icon="pi pi-percentage" severity="info" text rounded @click="openRateTiersDialog(data)" v-tooltip.top="'Gestionar tasas'" />
            <Button icon="pi pi-pencil" severity="secondary" text rounded @click="openDialog(data)" v-tooltip.top="'Editar'" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" v-tooltip.top="'Eliminar'" />
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
        <div class="col-span-2 bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-sm text-blue-800">
            <i class="pi pi-info-circle mr-2"></i>
            <strong>Las tasas se generarán automáticamente</strong> según los rangos del BCE que caigan dentro de tu plazo mínimo-máximo.
            Después puedes editarlas usando el botón "Gestionar tasas" <i class="pi pi-percentage"></i>
          </p>
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

    <!-- Rate Tiers Management Dialog -->
    <Dialog v-model:visible="rateTiersDialogVisible" :header="`Gestionar Tasas: ${selectedProduct?.name}`" modal class="w-full max-w-4xl">
      <div class="flex flex-col gap-4">
        <!-- BCE Reference Rates -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 class="font-semibold text-blue-900 mb-3">Límites de Tasas BCE (Referencia)</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div v-for="limit in bceLimits" :key="limit.id" class="bg-white rounded p-2">
              <div class="font-medium text-gray-700">{{ limit.rangeName }} días</div>
              <div class="text-gray-600">BCE: <strong>{{ limit.bceReferenceRate }}%</strong></div>
              <div class="text-gray-500">Rango: {{ limit.minAllowedRate }}% - {{ limit.maxAllowedRate }}%</div>
            </div>
          </div>
        </div>

        <!-- Current Rate Tiers Table -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800">Tasas Configuradas</h3>
            <Button label="Agregar Tasa" icon="pi pi-plus" size="small" @click="openRateTierForm()" />
          </div>
          <DataTable :value="rateTiers" :loading="loadingTiers" stripedRows class="text-sm">
            <Column field="rangeName" header="Rango" />
            <Column header="Días">
              <template #body="{ data }">{{ data.minDays }} - {{ data.maxDays || '∞' }}</template>
            </Column>
            <Column field="annualRate" header="Tasa Anual (%)">
              <template #body="{ data }">
                <span :class="isRateWithinLimits(data) ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                  {{ data.annualRate }}%
                </span>
              </template>
            </Column>
            <Column header="Estado">
              <template #body="{ data }">
                <Tag v-if="isRateWithinLimits(data)" value="Dentro de límites BCE" severity="success" />
                <Tag v-else value="Fuera de límites BCE" severity="danger" />
              </template>
            </Column>
            <Column header="Acciones">
              <template #body="{ data }">
                <div class="flex gap-2">
                  <Button icon="pi pi-pencil" size="small" severity="secondary" text rounded @click="openRateTierForm(data)" />
                  <Button icon="pi pi-trash" size="small" severity="danger" text rounded @click="confirmDeleteTier(data)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </Dialog>

    <!-- Rate Tier Form Dialog -->
    <Dialog v-model:visible="tierFormVisible" :header="editingTierId ? 'Editar Tasa' : 'Nueva Tasa'" modal class="w-full max-w-md">
      <form @submit.prevent="saveTier" class="flex flex-col gap-4 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Nombre del Rango</label>
          <InputText v-model="tierForm.rangeName" placeholder="Ej: 30-60, 361+" class="w-full" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Días Mínimos</label>
            <InputNumber v-model="tierForm.minDays" :min="0" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Días Máximos</label>
            <InputNumber v-model="tierForm.maxDays" :min="0" fluid placeholder="Vacío = ∞" />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Tasa Anual (%)</label>
          <InputNumber v-model="tierForm.annualRate" :minFractionDigits="2" :maxFractionDigits="2" :min="0" :max="100" fluid />
          <span v-if="tierFormValidation.message" :class="tierFormValidation.valid ? 'text-green-600 text-xs' : 'text-red-600 text-xs'">
            {{ tierFormValidation.message }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="tierForm.active" :binary="true" />
          <label class="text-sm">Activo</label>
        </div>
        <div class="flex justify-end gap-2">
          <Button label="Cancelar" severity="secondary" @click="tierFormVisible = false" />
          <Button type="submit" label="Guardar" :loading="savingTier" :disabled="!tierFormValidation.valid" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
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
import { paymentFrequencyLabel } from '../../utils/investment-payment-frequency';

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
  { label: 'Bimensual', value: 'bimonthly' },
  { label: 'Trimestral', value: 'quarterly' },
  { label: 'Semestral', value: 'semiannual' },
];

const emptyForm = () => ({ name: '', minTermDays: 30, maxTermDays: 360, minAmount: 500, maxAmount: null as any, paymentFrequency: 'at_maturity', autoRenew: false, active: true });
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

// ============ Rate Tiers Management ============

const rateTiersDialogVisible = ref(false);
const tierFormVisible = ref(false);
const selectedProduct = ref<any>(null);
const rateTiers = ref<any[]>([]);
const bceLimits = ref<any[]>([]);
const loadingTiers = ref(false);
const savingTier = ref(false);
const editingTierId = ref<string | null>(null);

const emptyTierForm = () => ({
  rangeName: '',
  minDays: 0,
  maxDays: null as any,
  annualRate: 0,
  active: true,
});
const tierForm = ref(emptyTierForm());

async function openRateTiersDialog(product: any) {
  selectedProduct.value = product;
  rateTiersDialogVisible.value = true;
  loadingTiers.value = true;
  try {
    // Load BCE limits for reference
    const bceLimitsRes = await api.get('/public/bce-rate-limits');
    bceLimits.value = bceLimitsRes.data;

    // Load product rate tiers
    const tiersRes = await api.get(`/investment-products/${product.id}`);
    rateTiers.value = tiersRes.data.rateTiers || [];
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las tasas', life: 4000 });
  } finally {
    loadingTiers.value = false;
  }
}

function openRateTierForm(tier?: any) {
  tierForm.value = tier ? { ...tier } : emptyTierForm();
  editingTierId.value = tier?.id ?? null;
  tierFormVisible.value = true;
}

function isRateWithinLimits(tier: any): boolean {
  const limit = bceLimits.value.find(
    (l) => tier.minDays >= l.minDays && (l.maxDays === null || tier.minDays <= l.maxDays)
  );
  if (!limit) return false;
  return tier.annualRate >= limit.minAllowedRate && tier.annualRate <= limit.maxAllowedRate;
}

const tierFormValidation = computed(() => {
  const rate = tierForm.value.annualRate;
  const minDays = tierForm.value.minDays;

  const limit = bceLimits.value.find(
    (l) => minDays >= l.minDays && (l.maxDays === null || minDays <= l.maxDays)
  );

  if (!limit) {
    return { valid: false, message: 'No se encontró límite BCE para este rango de días' };
  }

  const within = rate >= limit.minAllowedRate && rate <= limit.maxAllowedRate;
  if (within) {
    return { valid: true, message: `✓ Dentro del rango BCE (${limit.minAllowedRate}% - ${limit.maxAllowedRate}%)` };
  } else {
    return { valid: false, message: `⚠ Debe estar entre ${limit.minAllowedRate}% y ${limit.maxAllowedRate}% según BCE` };
  }
});

async function saveTier() {
  if (!tierFormValidation.value.valid) {
    toast.add({ severity: 'warn', summary: 'Tasa fuera de límites BCE', life: 3000 });
    return;
  }

  savingTier.value = true;
  try {
    const payload = { ...tierForm.value, productId: selectedProduct.value.id };

    if (editingTierId.value) {
      const { data } = await api.put(`/investment-rate-tiers/${editingTierId.value}`, payload);
      const idx = rateTiers.value.findIndex((t) => t.id === editingTierId.value);
      if (idx !== -1) rateTiers.value[idx] = data;
    } else {
      const { data } = await api.post('/investment-rate-tiers', payload);
      rateTiers.value.push(data);
    }

    toast.add({ severity: 'success', summary: 'Tasa guardada', life: 3000 });
    tierFormVisible.value = false;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'No se pudo guardar', life: 4000 });
  } finally {
    savingTier.value = false;
  }
}

function confirmDeleteTier(tier: any) {
  confirm.require({
    message: `¿Eliminar la tasa para "${tier.rangeName}"?`,
    header: 'Confirmar',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/investment-rate-tiers/${tier.id}`);
        rateTiers.value = rateTiers.value.filter((t) => t.id !== tier.id);
        toast.add({ severity: 'success', summary: 'Tasa eliminada', life: 3000 });
      } catch (error: any) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 4000 });
      }
    },
  });
}
</script>
