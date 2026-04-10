<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Simulador de Crédito</h1>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card class="lg:col-span-1">
        <template #title>Parámetros del crédito</template>
        <template #content>
          <form @submit.prevent="simulate" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Tipo de crédito</label>
              <Select v-model="form.creditTypeId" :options="creditTypes" optionLabel="name" optionValue="id" placeholder="Seleccione..." @change="onTypeChange" />
            </div>
            <div v-if="selectedType" class="text-xs text-gray-500 bg-gray-50 rounded p-2">
              Tasa anual: <strong>{{ selectedType.annualRate }}%</strong> |
              Máx. JPRF: <strong>{{ selectedType.maxJprfRate }}%</strong> |
              Amortización: <strong>{{ selectedType.amortizationSystem === 'french' ? 'Francés' : 'Alemán' }}</strong>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Monto (USD)</label>
              <InputNumber v-model="form.amount" :min="selectedType?.minAmount || 0" :max="selectedType?.maxAmount || 999999" mode="currency" currency="USD" locale="es-EC" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Plazo (meses)</label>
              <InputNumber v-model="form.termMonths" :min="selectedType?.minTermMonths || 1" :max="selectedType?.maxTermMonths || 360" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Ingresos netos mensuales (USD)</label>
              <InputNumber v-model="form.netIncome" :min="0" mode="currency" currency="USD" locale="es-EC" />
            </div>
            <Button type="submit" label="Simular" icon="pi pi-calculator" :loading="loading" />
            <Button v-if="result" label="Solicitar este crédito" icon="pi pi-file-edit" severity="success" @click="goToApplication" />
          </form>
        </template>
      </Card>

      <div class="lg:col-span-2 flex flex-col gap-4" v-if="result">
        <CreditSummary :summary="result.summary" />
        <PaymentCapacityAlert :installment="result.summary.firstInstallment" :net-income="form.netIncome || 0" />
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Tabla de amortización</span>
              <PdfDownloadButton label="Descargar PDF" @download="downloadPdf" />
            </div>
          </template>
          <template #content>
            <AmortizationTable :schedule="result.rows" />
          </template>
        </Card>
        <div class="flex flex-col gap-2">
          <LegalNote v-for="note in legalNotes" :key="note" :text="note" />
        </div>
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

const form = ref({ creditTypeId: null as any, amount: 5000, termMonths: 24, netIncome: 800 });
const selectedType = computed(() => creditTypes.value.find((t) => t.id === form.value.creditTypeId));

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

function onTypeChange() { result.value = null; }

onMounted(async () => {
  await creditStore.fetchPublicTypes(slug.value);
});

async function simulate() {
  if (!form.value.creditTypeId) return toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
  loading.value = true;
  try {
    result.value = await creditStore.simulatePublic(slug.value, {
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      system: selectedType.value?.amortizationSystem ?? 'french',
      monthlyIncome: form.value.netIncome || undefined,
    });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo simular', life: 4000 });
  } finally {
    loading.value = false;
  }
}

function goToApplication() {
  router.push(`/${slug.value}/solicitar-credito`);
}

function downloadPdf() {
  if (!result.value) return;
  generateCreditPdf(result.value.summary, result.value.rows, institution.value);
}
</script>
