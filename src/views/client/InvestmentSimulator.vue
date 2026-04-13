<template>
  <div class="flex w-full flex-col items-center">
    <h1 class="mb-6 w-full max-w-2xl text-center text-2xl font-bold text-gray-800">Simulador de Inversión</h1>
    <div v-if="!formCollapsed" class="flex w-full justify-center px-0 sm:px-2">
      <div class="w-full max-w-lg">
        <Card class="w-full shadow-sm">
          <template #title>Parámetros de inversión</template>
          <template #content>
            <form @submit.prevent="simulate" class="flex flex-col gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Producto de inversión</label>
                <Select v-model="form.productId" :options="products" optionLabel="name" optionValue="id" placeholder="Seleccione..." @change="onProductChange" />
              </div>
              <div v-if="selectedProduct" class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                <span>Plazo <strong class="text-gray-800">{{ termMin }}–{{ termMax }}</strong> días</span>
                <span class="text-slate-300 hidden sm:inline">|</span>
                <span>Mín. inversión <strong class="text-gray-800">${{ selectedProduct.minAmount }}</strong></span>
                <span class="text-slate-300 hidden sm:inline">|</span>
                <span>Pago <strong class="text-gray-800">{{ paymentFrequencyLabel(selectedProduct.paymentFrequency) }}</strong></span>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto a invertir (USD)</label>
                <InputNumber v-model="form.amount" :min="selectedProduct?.minAmount || 0" :max="selectedProduct?.maxAmount || undefined" mode="currency" currency="USD" locale="es-EC" fluid />
                <span v-if="selectedProduct" class="text-xs text-gray-400">Mín: ${{ selectedProduct.minAmount }}{{ selectedProduct.maxAmount ? ` — Máx: $${selectedProduct.maxAmount}` : '' }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (días)</label>
                <InputNumber
                  v-model="form.termDays"
                  :min="termMin"
                  :max="termMax"
                  :step="1"
                  :useGrouping="false"
                  :minFractionDigits="0"
                  :maxFractionDigits="0"
                  fluid
                  placeholder="Ej. 91"
                />
                <span v-if="selectedProduct" class="text-xs text-gray-400">Cualquier número entero entre {{ termMin }} y {{ termMax }} días.</span>
              </div>

              <div
                v-if="appliedRatePreview?.kind === 'ok'"
                class="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <div class="flex gap-4">
                  <div
                    class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600"
                    aria-hidden="true"
                  >
                    <i class="pi pi-percentage text-lg"></i>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Tasa anual aplicable</p>
                    <p class="mt-0.5 text-3xl font-bold tabular-nums leading-tight text-gray-900">{{ appliedRatePreview.rate }}%</p>
                    <p class="mt-2 text-sm text-gray-600">
                      <span class="font-medium text-gray-800">{{ appliedRatePreview.days }} días</span>
                      <span class="mx-1.5 text-gray-300">·</span>
                      <span>{{ appliedRatePreview.tierCaption }}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div
                v-else-if="appliedRatePreview?.kind === 'out_of_range'"
                class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
              >
                Indica un plazo entre <strong>{{ termMin }}</strong> y <strong>{{ termMax }}</strong> días.
              </div>
              <div
                v-else-if="appliedRatePreview?.kind === 'no_rate'"
                class="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
              >
                No hay tasa definida para este plazo. Revisa el producto en administración.
              </div>

              <Button type="submit" label="Simular" icon="pi pi-calculator" :loading="loading" />
            </form>
          </template>
        </Card>
      </div>
    </div>

    <div
      v-if="result"
      class="mb-4 flex w-full max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
    >
      <div class="text-sm text-gray-700 flex flex-wrap gap-4">
        <span><strong>{{ selectedProduct?.name }}</strong></span>
        <span>Monto: <strong>${{ form.amount?.toFixed(2) }}</strong></span>
        <span>Plazo: <strong>{{ form.termDays }} días</strong></span>
        <span>Tasa: <strong>{{ resolvedAnnualRate != null ? resolvedAnnualRate + '%' : '—' }}</strong></span>
        <span>Pago de intereses: <strong>{{ paymentFrequencyLabel(selectedProduct?.paymentFrequency) }}</strong></span>
      </div>
      <div class="flex flex-wrap gap-2 sm:ml-4">
        <Button label="Modificar" icon="pi pi-pencil" severity="secondary" size="small" @click="backToEdit" />
        <Button label="Descargar PDF" icon="pi pi-download" severity="info" size="small" @click="downloadPdf" />
        <Button label="Invertir" icon="pi pi-wallet" severity="success" size="small" @click="goToApplication" />
      </div>
    </div>

    <div v-if="result" class="flex w-full max-w-4xl flex-col gap-4">
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div v-for="item in summaryItems" :key="item.label" class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
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
            <div><span class="font-medium">Pago de intereses:</span> {{ paymentFrequencyLabel(selectedProduct?.paymentFrequency) }}</div>
            <div><span class="font-medium">Interés bruto:</span> ${{ result.summary.grossInterest?.toFixed(2) }}</div>
            <div><span class="font-medium">Retención IR (2%):</span> ${{ result.summary.irWithholding?.toFixed(2) }}</div>
            <div><span class="font-medium">Interés neto:</span> ${{ result.summary.netInterest?.toFixed(2) }}</div>
            <div><span class="font-medium">Al vencimiento:</span> ${{ result.summary.amountAtMaturity?.toFixed(2) }}</div>
          </div>
        </template>
      </Card>

      <!-- Tabla de proyección período a período -->
      <Card v-if="result.projectionTable && result.projectionTable.length > 0">
        <template #title>
          <span>Proyección período a período</span>
        </template>
        <template #content>
          <DataTable :value="result.projectionTable" striped responsive-layout="scroll" class="text-sm">
            <Column field="period" header="Período" :sortable="true"></Column>
            <Column field="accumulatedDays" header="Días acumulados" :sortable="true"></Column>
            <Column field="grossInterest" header="Interés bruto">
              <template #body="{ data }">
                ${{ data.grossInterest?.toFixed(2) }}
              </template>
            </Column>
            <Column field="irWithholding" header="Retención IR (2%)">
              <template #body="{ data }">
                ${{ data.irWithholding?.toFixed(2) }}
              </template>
            </Column>
            <Column field="netInterest" header="Interés neto">
              <template #body="{ data }">
                ${{ data.netInterest?.toFixed(2) }}
              </template>
            </Column>
            <Column field="totalAtMaturity" header="Total al vencimiento">
              <template #body="{ data }">
                <span v-if="data.totalAtMaturity" class="font-bold text-gray-900">
                  ${{ data.totalAtMaturity?.toFixed(2) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>
            </Column>
          </DataTable>
        </template>
      </Card>

      <LegalNote text="Retención del 2% sobre rendimientos financieros (LRTI Art. 37, Reg. Art. 131). COSEDE garantiza depósitos hasta el límite vigente (Art. 330 COMF). Simulación informativa." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useToast } from 'primevue/usetoast';
import { useInstitutionStore } from '../../stores/institution.store';
import LegalNote from '../../components/LegalNote.vue';
import PdfDownloadButton from '../../components/PdfDownloadButton.vue';
import { usePdf } from '../../composables/usePdf';
import { formatCurrency } from '../../utils/financial-calculations';
import { paymentFrequencyLabel } from '../../utils/investment-payment-frequency';
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

const termMin = computed(() => (selectedProduct.value ? Number(selectedProduct.value.minTermDays) : 1));
const termMax = computed(() => (selectedProduct.value ? Number(selectedProduct.value.maxTermDays) : 36500));

function activeTiers(p: any) {
  return (p.rateTiers || [])
    .filter((t: any) => t.active !== false)
    .sort((a: any, b: any) => Number(a.minDays) - Number(b.minDays));
}

function findTierForDays(p: any, days: number) {
  return (
    activeTiers(p).find(
      (t: any) => days >= Number(t.minDays) && (t.maxDays === null || days <= Number(t.maxDays)),
    ) ?? null
  );
}

/** Tasa que aplicaría el backend para el plazo escrito (misma lógica que la simulación). */
const resolvedAnnualRate = computed((): number | null => {
  const p = selectedProduct.value;
  const days = form.value.termDays;
  if (!p || days == null) return null;
  const d = Math.round(Number(days));
  if (d < termMin.value || d > termMax.value) return null;
  const tier = findTierForDays(p, d);
  if (tier) return Number(tier.annualRate);
  return p.annualRate != null ? Number(p.annualRate) : null;
});

/** Resumen visual de la tasa (sin listar todos los tramos). */
const appliedRatePreview = computed(():
  | { kind: 'ok'; days: number; rate: number; tierCaption: string }
  | { kind: 'out_of_range' }
  | { kind: 'no_rate' }
  | null => {
  const p = selectedProduct.value;
  if (!p) return null;
  const raw = form.value.termDays;
  if (raw == null) return null;
  const d = Math.round(Number(raw));
  if (!Number.isFinite(d)) return null;
  if (d < termMin.value || d > termMax.value) return { kind: 'out_of_range' };

  const tier = findTierForDays(p, d);
  const rate = tier != null ? Number(tier.annualRate) : p.annualRate != null ? Number(p.annualRate) : null;
  if (rate == null) return { kind: 'no_rate' };

  let tierCaption: string;
  if (tier) {
    const label = tier.rangeName || `${tier.minDays}–${tier.maxDays ?? '∞'} días`;
    tierCaption = `Tramo ${label}`;
  } else {
    tierCaption = 'Tasa única del producto';
  }

  return { kind: 'ok', days: d, rate, tierCaption };
});

const summaryItems = computed(() => {
  if (!result.value) return [];
  return [
    { label: 'Interés bruto', value: formatCurrency(result.value.summary.grossInterest) },
    { label: 'Retención IR', value: formatCurrency(result.value.summary.irWithholding) },
    { label: 'Interés neto', value: formatCurrency(result.value.summary.netInterest) },
    { label: 'Al vencimiento', value: formatCurrency(result.value.summary.amountAtMaturity) },
  ];
});

watch(
  () => form.value.termDays,
  () => {
    result.value = null;
  },
);
watch(
  () => form.value.amount,
  () => {
    result.value = null;
  },
);

function onProductChange() {
  result.value = null;
  formCollapsed.value = false;
  const p = selectedProduct.value;
  form.value.termDays = p ? Number(p.minTermDays) : null;
}

function backToEdit() {
  result.value = null;
  formCollapsed.value = false;
}

onMounted(async () => {
  const { data } = await api.get(`/public/${slug.value}/investment-products`);
  products.value = data;
});

async function simulate() {
  if (!form.value.productId) return toast.add({ severity: 'warn', summary: 'Seleccione un producto', life: 3000 });
  if (form.value.termDays == null) {
    return toast.add({ severity: 'warn', summary: 'Indique el plazo en días', life: 3000 });
  }
  const td = Math.round(Number(form.value.termDays));
  if (!Number.isFinite(td)) {
    return toast.add({ severity: 'warn', summary: 'Plazo inválido', life: 3000 });
  }
  if (td < termMin.value || td > termMax.value) {
    return toast.add({
      severity: 'warn',
      summary: `El plazo debe estar entre ${termMin.value} y ${termMax.value} días`,
      life: 4000,
    });
  }
  form.value.termDays = td;

  const p = selectedProduct.value;
  if (p) {
    if (form.value.amount < p.minAmount || (p.maxAmount && form.value.amount > p.maxAmount)) {
      form.value.amount = Math.min(Math.max(form.value.amount, p.minAmount), p.maxAmount || Infinity);
      return toast.add({ severity: 'warn', summary: `Monto debe ser mínimo $${p.minAmount}${p.maxAmount ? ` y máximo $${p.maxAmount}` : ''}`, life: 3000 });
    }
  }
  loading.value = true;
  try {
    const { data } = await api.post(`/public/${slug.value}/simulate/investment`, {
      productId: form.value.productId,
      amount: form.value.amount,
      termDays: td,
      paymentFrequency: selectedProduct.value?.paymentFrequency || 'at_maturity',
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
