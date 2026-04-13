<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Simulador de Crédito</h1>
    <div v-if="!formCollapsed">
      <Card>
        <template #title>Parámetros del crédito</template>
        <template #content>
          <form @submit.prevent="simulate" class="flex flex-col gap-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Tipo de crédito</label>
                <Select v-model="form.creditTypeId" :options="creditTypes" optionLabel="name" optionValue="id" placeholder="Seleccione..." @change="onTypeChange" />
                <span v-if="selectedType" class="text-xs text-gray-500">
                  Tasa anual: <strong>{{ selectedType.annualRate }}%</strong> | Máx. JPRF: <strong>{{ selectedType.maxJprfRate }}%</strong>
                </span>
              </div>
              <div v-if="selectedType" class="flex flex-col gap-1">
                <label class="text-sm font-medium">Sistema de amortización</label>
                <Select v-model="form.amortizationSystem" :options="[{label:'Francés (cuota fija)',value:'french'},{label:'Alemán (cuotas decrecientes)',value:'german'}]" optionLabel="label" optionValue="value" />
                <span class="text-xs text-gray-400">Derecho del cliente según Art. 184 del COMF</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto (USD)</label>
                <InputNumber v-model="form.amount" :min="selectedType?.minAmount || 0" :max="selectedType?.maxAmount || 999999" mode="currency" currency="USD" locale="es-EC" fluid />
                <span v-if="selectedType" class="text-xs text-gray-400">Mín: ${{ selectedType.minAmount }} — Máx: ${{ selectedType.maxAmount }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (meses)</label>
                <InputNumber v-model="form.termMonths" :min="selectedType?.minTermMonths || 1" :max="selectedType?.maxTermMonths || 360" fluid />
                <span v-if="selectedType" class="text-xs text-gray-400">Mín: {{ selectedType.minTermMonths }} meses — Máx: {{ selectedType.maxTermMonths }} meses</span>
                <span v-if="form.termMonths" class="text-xs text-blue-500 font-medium">{{ formatTermMonths(form.termMonths) }}</span>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Ingresos netos mensuales (USD)</label>
                <InputNumber v-model="form.netIncome" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                <div v-if="maxPaymentCapacity !== null" class="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                  <p class="font-semibold text-blue-900">
                    <i class="pi pi-info-circle mr-1"></i>
                    Con tus ingresos puedes pagar hasta:
                  </p>
                  <p class="text-lg font-bold text-blue-700 mt-1">${{ formatNumber(maxPaymentCapacity) }} USD/mes</p>
                  <small class="text-gray-600">Calculado como el 40% de tus ingresos netos</small>
                </div>
              </div>
            </div>
            <div v-if="maxPaymentCapacity !== null" class="p-2 bg-blue-50 border border-blue-200 rounded text-sm">
              <p class="font-semibold text-blue-900">
                <i class="pi pi-info-circle mr-1"></i>
                Con tus ingresos puedes pagar hasta:
              </p>
              <p class="text-lg font-bold text-blue-700 mt-1">${{ maxPaymentCapacity.toFixed(2) }} USD/mes</p>
              <small class="text-gray-600">Calculado como el 40% de tus ingresos netos</small>
            </div>
            <div class="flex justify-end">
              <Button type="submit" label="Simular" icon="pi pi-calculator" :loading="loading" />
            </div>
          </form>
        </template>
      </Card>
    </div>

    <div v-if="result" class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
      <div class="text-sm text-gray-700 flex flex-wrap gap-4">
        <span><strong>{{ selectedType?.name }}</strong></span>
        <span>Monto: <strong>${{ formatNumber(form.amount) }}</strong></span>
        <span>Plazo: <strong>{{ formatTermMonths(form.termMonths) }}</strong></span>
        <span>Sistema: <strong>{{ form.amortizationSystem === 'french' ? 'Francés' : 'Alemán' }}</strong></span>
      </div>
      <div class="flex gap-2 ml-4">
        <Button label="Modificar" icon="pi pi-pencil" severity="secondary" size="small" @click="backToEdit" />
        <Button label="Descargar PDF" icon="pi pi-download" severity="info" size="small" @click="downloadPdf" />
        <Button label="Solicitar" icon="pi pi-file-edit" severity="success" size="small" @click="goToApplication" />
      </div>
    </div>

    <div v-if="result" class="flex flex-col gap-4">
      <CreditSummary :summary="result.summary" />
      <PaymentCapacityAlert :installment="result.summary.firstInstallment" :net-income="form.netIncome || 0" />

      <Card v-if="comparisonResult">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-sync"></i>
            <span>Comparación entre sistemas de amortización</span>
          </div>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-blue-900">
                  {{ form.amortizationSystem === 'french' ? 'Francés (actual)' : 'Alemán (actual)' }}
                </h3>
                <span class="text-xs bg-blue-600 text-white px-2 py-1 rounded">Seleccionado</span>
              </div>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">{{ form.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota' }}:</span><strong>{{ formatCurrency(result.summary.firstInstallment) }}</strong></div>
                <div class="flex justify-between"><span class="text-gray-600">Total a pagar:</span><strong>{{ formatCurrency(result.summary.totalCreditCost) }}</strong></div>
                <div class="flex justify-between"><span class="text-gray-600">Total interés:</span><strong>{{ formatCurrency(result.summary.totalInterest) }}</strong></div>
              </div>
            </div>
            <div class="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-gray-700">
                  {{ form.amortizationSystem === 'french' ? 'Alemán' : 'Francés' }}
                </h3>
                <Button label="Cambiar a este" size="small" severity="secondary" outlined @click="switchSystem" />
              </div>
              <div class="flex flex-col gap-2 text-sm">
                <div class="flex justify-between"><span class="text-gray-600">{{ form.amortizationSystem === 'french' ? 'Primera cuota' : 'Cuota mensual' }}:</span><strong>{{ formatCurrency(comparisonResult.summary.firstInstallment) }}</strong></div>
                <div class="flex justify-between"><span class="text-gray-600">Total a pagar:</span><strong>{{ formatCurrency(comparisonResult.summary.totalCreditCost) }}</strong></div>
                <div class="flex justify-between"><span class="text-gray-600">Total interés:</span><strong>{{ formatCurrency(comparisonResult.summary.totalInterest) }}</strong></div>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-300 text-xs">
                <span v-if="interestDifference > 0" class="text-red-600 font-medium">
                  <i class="pi pi-arrow-up mr-1"></i>{{ formatCurrency(Math.abs(interestDifference)) }} más de interés
                </span>
                <span v-else-if="interestDifference < 0" class="text-green-600 font-medium">
                  <i class="pi pi-arrow-down mr-1"></i>{{ formatCurrency(Math.abs(interestDifference)) }} menos de interés
                </span>
                <span v-else class="text-gray-500">Mismo interés total</span>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card>
        <template #title>
          <div class="flex items-center justify-between">
            <button type="button" class="flex items-center gap-2 hover:text-blue-600 transition-colors" @click="tableOpen = !tableOpen">
              <i :class="tableOpen ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"></i>
              <span>Tabla de amortización</span>
            </button>
            <PdfDownloadButton label="Descargar PDF" @download="downloadPdf" />
          </div>
        </template>
        <template #content>
          <div v-show="tableOpen">
            <AmortizationTable :schedule="result.rows" :loan-amount="form.amount" />
          </div>
        </template>
      </Card>
      <div class="flex flex-col gap-2">
        <LegalNote v-for="note in legalNotes" :key="note" :text="note" />
      </div>
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
import { useCreditStore } from '../../stores/credit.store';
import { useInstitutionStore } from '../../stores/institution.store';
import CreditSummary from '../../components/CreditSummary.vue';
import PaymentCapacityAlert from '../../components/PaymentCapacityAlert.vue';
import AmortizationTable from '../../components/AmortizationTable.vue';
import LegalNote from '../../components/LegalNote.vue';
import PdfDownloadButton from '../../components/PdfDownloadButton.vue';
import { usePdf } from '../../composables/usePdf';
import { formatNumber, formatCurrency, ensureNumbers } from '../../utils/number-utils';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const slug = computed(() => route.params.slug as string);
const creditStore = useCreditStore();
const institutionStore = useInstitutionStore();
const { creditTypes } = storeToRefs(creditStore);
const { institution } = storeToRefs(institutionStore);
const { generateCreditPdf } = usePdf();

const loading = ref(false);
const result = ref<any>(null);
const comparisonResult = ref<any>(null);
const formCollapsed = ref(false);
const tableOpen = ref(false);

const interestDifference = computed(() => {
  if (!result.value || !comparisonResult.value) return 0;
  return comparisonResult.value.summary.totalInterest - result.value.summary.totalInterest;
});

const form = ref({ creditTypeId: null as any, amount: null as any, termMonths: null as any, netIncome: null as any, amortizationSystem: 'french' as 'french' | 'german' });
const selectedType = computed(() => creditTypes.value.find((t) => t.id === form.value.creditTypeId));

// Calcular capacidad máxima de pago (40% de ingresos netos)
const maxPaymentCapacity = computed(() => {
  const income = form.value.netIncome || 0;
  if (income <= 0) return null;
  return income * 0.4;
});

const legalNotes = computed(() => {
  if (!result.value) return [];
  const notes: string[] = [];
  result.value.rows?.forEach((r: any) =>
    r.additionalCharges?.forEach((c: any) => { if (c.legalNote) notes.push(c.legalNote); }),
  );
  result.value.disbursementCharges?.forEach((c: any) => { if (c.legalNote) notes.push(c.legalNote); });
  notes.push('Tasas reguladas por la JPRF (Resolución No. 646-2023-F). Simulación informativa sujeta a aprobación crediticia.');
  return [...new Set(notes)];
});

function onTypeChange() { result.value = null; comparisonResult.value = null; formCollapsed.value = false; form.value.amortizationSystem = 'french'; }

function backToEdit() {
  result.value = null;
  comparisonResult.value = null;
  formCollapsed.value = false;
}

async function switchSystem() {
  form.value.amortizationSystem = form.value.amortizationSystem === 'french' ? 'german' : 'french';
  await simulate();
}

function formatTermMonths(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} ${m === 1 ? 'mes' : 'meses'}`;
  if (m === 0) return `${y} ${y === 1 ? 'año' : 'años'}`;
  return `${y} ${y === 1 ? 'año' : 'años'} y ${m} ${m === 1 ? 'mes' : 'meses'}`;
}

onMounted(async () => {
  await creditStore.fetchPublicTypes(slug.value);
});

async function simulate() {
  if (!form.value.creditTypeId) return toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
  const t = selectedType.value;
  if (t) {
    if (form.value.amount < t.minAmount || form.value.amount > t.maxAmount) {
      form.value.amount = Math.min(Math.max(form.value.amount, t.minAmount), t.maxAmount);
      toast.add({ severity: 'info', summary: `Monto ajustado al rango $${t.minAmount} — $${t.maxAmount}`, life: 3000 });
    }
    if (form.value.termMonths < t.minTermMonths || form.value.termMonths > t.maxTermMonths) {
      form.value.termMonths = Math.min(Math.max(form.value.termMonths, t.minTermMonths), t.maxTermMonths);
      toast.add({ severity: 'info', summary: `Plazo ajustado al rango ${t.minTermMonths} — ${t.maxTermMonths} meses`, life: 3000 });
    }
  }
  loading.value = true;
  try {
    const oppositeSystem = form.value.amortizationSystem === 'french' ? 'german' : 'french';
    const [primary, comparison] = await Promise.all([
      creditStore.simulatePublic(slug.value, {
        creditTypeId: form.value.creditTypeId,
        amount: form.value.amount,
        termMonths: form.value.termMonths,
        system: form.value.amortizationSystem,
        monthlyIncome: form.value.netIncome || undefined,
      }),
      creditStore.simulatePublic(slug.value, {
        creditTypeId: form.value.creditTypeId,
        amount: form.value.amount,
        termMonths: form.value.termMonths,
        system: oppositeSystem,
        monthlyIncome: form.value.netIncome || undefined,
      }),
    ]);
    result.value = primary;
    comparisonResult.value = comparison;
    tableOpen.value = false;
    formCollapsed.value = true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo simular', life: 4000 });
  } finally {
    loading.value = false;
  }
}

function goToApplication() {
  router.push({
    path: `/${slug.value}/solicitar-credito`,
    state: {
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      amortizationSystem: form.value.amortizationSystem,
      monthlyIncome: form.value.netIncome,
    },
  });
}

function downloadPdf() {
  if (!result.value) return;
  generateCreditPdf(result.value.summary, result.value.rows, institution.value, result.value.disbursementCharges);
}
</script>
