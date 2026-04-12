<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Simulador de Inversión</h1>
    <div v-if="!formCollapsed">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card class="lg:col-span-1">
          <template #title>Parámetros de inversión</template>
          <template #content>
            <form @submit.prevent="simulate" class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Producto de inversión</label>
                <Select v-model="form.productId" :options="products" optionLabel="name" optionValue="id" placeholder="Seleccione..." @change="onProductChange" />
              </div>
              <div v-if="selectedProduct" class="text-xs text-gray-500 bg-gray-50 rounded p-2">
                Tasa anual: <strong>{{ selectedProduct.annualRate }}%</strong> |
                Plazo: <strong>{{ selectedProduct.minTermDays }}–{{ selectedProduct.maxTermDays }} días</strong> |
                Mín.: <strong>${{ selectedProduct.minAmount }}</strong>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto a invertir (USD)</label>
                <InputNumber v-model="form.amount" :min="selectedProduct?.minAmount || 0" :max="selectedProduct?.maxAmount || undefined" mode="currency" currency="USD" locale="es-EC" fluid />
                <span v-if="selectedProduct" class="text-xs text-gray-400">Mín: ${{ selectedProduct.minAmount }}{{ selectedProduct.maxAmount ? ` — Máx: $${selectedProduct.maxAmount}` : '' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (días)</label>
                <InputNumber v-model="form.termDays" :min="selectedProduct?.minTermDays || 30" :max="selectedProduct?.maxTermDays || 720" fluid />
                <span v-if="selectedProduct" class="text-xs text-gray-400">Mín: {{ selectedProduct.minTermDays }} días — Máx: {{ selectedProduct.maxTermDays }} días</span>
              </div>
              <Button type="submit" label="Simular" icon="pi pi-calculator" :loading="loading" />
            </form>
          </template>
        </Card>
      </div>
    </div>

    <div v-if="result" class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
      <div class="text-sm text-gray-700 flex flex-wrap gap-4">
        <span><strong>{{ selectedProduct?.name }}</strong></span>
        <span>Monto: <strong>${{ form.amount?.toFixed(2) }}</strong></span>
        <span>Plazo: <strong>{{ form.termDays }} días</strong></span>
        <span>Tasa: <strong>{{ selectedProduct?.annualRate }}%</strong></span>
      </div>
      <div class="flex gap-2 ml-4">
        <Button label="Modificar" icon="pi pi-pencil" severity="secondary" size="small" @click="formCollapsed = false" />
        <Button label="Descargar PDF" icon="pi pi-download" severity="info" size="small" @click="downloadPdf" />
        <Button label="Invertir" icon="pi pi-wallet" severity="success" size="small" @click="goToApplication" />
      </div>
    </div>

    <div v-if="result" class="flex flex-col gap-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="item in summaryItems" :key="item.label" class="bg-white rounded-xl shadow p-4">
          <p class="text-xs text-gray-500">{{ item.label }}</p>
          <p class="text-xl font-bold text-gray-800">{{ item.value }}</p>
        </div>
      </div>
      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Resumen de la inversión</span>
            <PdfDownloadButton label="Descargar PDF" @download="downloadPdf" />
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span class="font-medium">Monto invertido:</span> ${{ result.summary.amount?.toFixed(2) }}</div>
            <div><span class="font-medium">Tasa anual:</span> {{ result.summary.annualRate }}%</div>
            <div><span class="font-medium">Plazo:</span> {{ result.summary.termDays }} días</div>
            <div><span class="font-medium">Interés bruto:</span> ${{ result.summary.grossInterest?.toFixed(2) }}</div>
            <div><span class="font-medium">Retención IR (2%):</span> ${{ result.summary.irWithholding?.toFixed(2) }}</div>
            <div><span class="font-medium">Interés neto:</span> ${{ result.summary.netInterest?.toFixed(2) }}</div>
            <div><span class="font-medium">Al vencimiento:</span> ${{ result.summary.amountAtMaturity?.toFixed(2) }}</div>
          </div>
        </template>
      </Card>
      <LegalNote text="Retención del 2% sobre rendimientos financieros (LRTI Art. 37, Reg. Art. 131). COSEDE garantiza depósitos hasta el límite vigente (Art. 330 COMF). Simulación informativa." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useInstitutionStore } from '../../stores/institution.store';
import LegalNote from '../../components/LegalNote.vue';
import PdfDownloadButton from '../../components/PdfDownloadButton.vue';
import { usePdf } from '../../composables/usePdf';
import { formatCurrency } from '../../utils/financial-calculations';
import api from '../../services/api';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const slug = computed(() => route.params.slug as string);
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const { generateInvestmentPdf } = usePdf();

const products = ref<any[]>([]);
const loading = ref(false);
const result = ref<any>(null);
const formCollapsed = ref(false);
const form = ref({ productId: null as any, amount: null as any, termDays: null as any });
const selectedProduct = computed(() => products.value.find((p) => p.id === form.value.productId));

const summaryItems = computed(() => {
  if (!result.value) return [];
  return [
    { label: 'Interés bruto', value: formatCurrency(result.value.summary.grossInterest) },
    { label: 'Retención IR', value: formatCurrency(result.value.summary.irWithholding) },
    { label: 'Interés neto', value: formatCurrency(result.value.summary.netInterest) },
    { label: 'Al vencimiento', value: formatCurrency(result.value.summary.amountAtMaturity) },
  ];
});

function onProductChange() { result.value = null; formCollapsed.value = false; }

onMounted(async () => {
  const { data } = await api.get(`/public/${slug.value}/investment-products`);
  products.value = data;
});

async function simulate() {
  if (!form.value.productId) return toast.add({ severity: 'warn', summary: 'Seleccione un producto', life: 3000 });
  const p = selectedProduct.value;
  if (p) {
    if (form.value.amount < p.minAmount || (p.maxAmount && form.value.amount > p.maxAmount)) {
      form.value.amount = Math.min(Math.max(form.value.amount, p.minAmount), p.maxAmount || Infinity);
      return toast.add({ severity: 'warn', summary: `Monto debe ser mínimo $${p.minAmount}${p.maxAmount ? ` y máximo $${p.maxAmount}` : ''}`, life: 3000 });
    }
    if (form.value.termDays < p.minTermDays || form.value.termDays > p.maxTermDays) {
      form.value.termDays = Math.min(Math.max(form.value.termDays, p.minTermDays), p.maxTermDays);
      return toast.add({ severity: 'warn', summary: `Plazo debe estar entre ${p.minTermDays} y ${p.maxTermDays} días`, life: 3000 });
    }
  }
  loading.value = true;
  try {
    const { data } = await api.post(`/public/${slug.value}/simulate/investment`, {
      productId: form.value.productId,
      amount: form.value.amount,
      termDays: form.value.termDays,
    });
    result.value = data;
    formCollapsed.value = true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo simular', life: 4000 });
  } finally {
    loading.value = false;
  }
}

function goToApplication() {
  router.push({
    path: `/${slug.value}/invertir`,
    state: {
      productId: form.value.productId,
      amount: form.value.amount,
      termDays: form.value.termDays,
    },
  });
}

function downloadPdf() {
  if (!result.value) return;
  generateInvestmentPdf(result.value.summary, institution.value);
}
</script>
