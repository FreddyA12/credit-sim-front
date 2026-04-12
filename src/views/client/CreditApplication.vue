<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitud de Crédito</h1>
    <div v-if="!submitted">
      <Steps :model="steps" :activeStep="activeStep" class="mb-6" />

      <Card>
        <template #content>
          <div v-if="activeStep === 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 class="col-span-2 text-lg font-semibold">Datos del solicitante</h2>
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-medium">Nombre completo *</label>
              <InputText v-model="form.clientName" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Cédula de identidad *</label>
              <InputText v-model="form.idNumber" @blur="checkCedula(form.idNumber)" :class="{ 'p-invalid': cedulaError }" maxlength="10" />
              <small class="text-red-500">{{ cedulaError }}</small>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Teléfono</label>
              <InputText v-model="form.clientPhone" />
            </div>
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-medium">Correo electrónico</label>
              <InputText v-model="form.clientEmail" type="email" />
            </div>
          </div>

          <div v-else-if="activeStep === 1" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold">Detalle del crédito</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Tipo de crédito</label>
                <Select v-model="form.creditTypeId" :options="creditTypes" optionLabel="name" optionValue="id" @change="simResult = null" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto solicitado (USD)</label>
                <InputNumber v-model="form.amount" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (meses)</label>
                <InputNumber v-model="form.termMonths" :min="1" :max="360" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Ingresos netos mensuales (USD)</label>
                <InputNumber v-model="form.monthlyIncome" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
              </div>
            </div>
            <Button label="Simular crédito" icon="pi pi-calculator" :loading="simulating" @click="runSimulation" />
            <div v-if="simResult" class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="font-semibold text-green-800 mb-2">Resultado de la simulación</p>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>{{ simResult.summary.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota' }}: <strong>${{ simResult.summary.firstInstallment?.toFixed(2) }}</strong></div>
                <div>Tasa aplicada: <strong>{{ simResult.summary.annualRatePct }}%</strong></div>
                <div>Total a pagar: <strong>${{ simResult.summary.totalCreditCost?.toFixed(2) }}</strong></div>
                <div>Total intereses: <strong>${{ simResult.summary.totalInterest?.toFixed(2) }}</strong></div>
              </div>
            </div>
          </div>

          <div v-else-if="activeStep === 2" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold">Documentos requeridos</h2>
            <p class="text-sm text-gray-500">Seleccione los archivos. Se subirán al enviar la solicitud.</p>
            <div v-for="doc in docFields" :key="doc.key" class="flex flex-col gap-1">
              <label class="text-sm font-medium">{{ doc.label }}</label>
              <input type="file" :accept="doc.accept" class="text-sm text-gray-600"
                @change="(e) => onFileSelect(doc.key, e)" />
              <span v-if="docFiles[doc.key]" class="text-xs text-green-600">
                <i class="pi pi-check-circle" /> {{ docFiles[doc.key].name }}
              </span>
            </div>
          </div>

          <div v-else-if="activeStep === 3" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold">Verificación biométrica</h2>
            <p class="text-sm text-gray-600">Para completar su solicitud, necesitamos verificar su identidad mediante reconocimiento facial.</p>
            <BiometricCapture @verified="onBiometricVerified" />
          </div>

          <div class="flex justify-between mt-6">
            <Button v-if="activeStep > 0" label="Anterior" severity="secondary" icon="pi pi-arrow-left" @click="activeStep--" />
            <Button v-if="activeStep < 3" label="Siguiente" icon="pi pi-arrow-right" iconPos="right" @click="nextStep" class="ml-auto" />
            <Button v-if="activeStep === 3" label="Enviar solicitud" icon="pi pi-send" :loading="submitting" :disabled="!biometricVerified" @click="submit" class="ml-auto" />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="flex flex-col items-center gap-4 py-12">
      <i class="pi pi-check-circle text-green-500 text-6xl" />
      <h2 class="text-2xl font-bold text-gray-800">¡Solicitud enviada!</h2>
      <p class="text-gray-500">Su solicitud ha sido recibida. Puede consultar el estado con su cédula.</p>
      <Button label="Consultar estado" icon="pi pi-search" @click="$router.push(`/${slug}/estado`)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Button from 'primevue/button';
import BiometricCapture from '../../components/BiometricCapture.vue';
import { useCreditStore } from '../../stores/credit.store';
import { useIdentityValidation } from '../../composables/useIdentityValidation';
import api from '../../services/api';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const toast = useToast();
const creditStore = useCreditStore();
const { creditTypes } = storeToRefs(creditStore);
const { cedulaError, checkCedula } = useIdentityValidation();

const activeStep = ref(0);
const submitted = ref(false);
const submitting = ref(false);
const simulating = ref(false);
const biometricVerified = ref(false);
const simResult = ref<any>(null);

const steps = [
  { label: 'Solicitante' },
  { label: 'Crédito' },
  { label: 'Documentos' },
  { label: 'Verificación' },
];

const docFields = [
  { key: 'cedula', label: 'Cédula de identidad (ambos lados)', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'utility', label: 'Planilla de servicios básicos', accept: '.pdf,.jpg,.jpeg,.png' },
  { key: 'income', label: 'Declaración de impuestos / Rol de pagos', accept: '.pdf,.jpg,.jpeg,.png' },
];
const docFiles = ref<Record<string, File>>({});

function onFileSelect(key: string, event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) docFiles.value[key] = file;
}

const state = history.state ?? {};
const form = ref({
  clientName: '',
  idNumber: '',
  clientPhone: '',
  clientEmail: '',
  creditTypeId: state.creditTypeId ?? null,
  amount: state.amount ?? null,
  termMonths: state.termMonths ?? null,
  monthlyIncome: state.monthlyIncome ?? null,
  amortizationSystem: state.amortizationSystem ?? 'french',
});

onMounted(() => creditStore.fetchPublicTypes(slug.value));

async function runSimulation() {
  if (!form.value.creditTypeId) return toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
  simulating.value = true;
  try {
    const selectedType = creditTypes.value.find((t) => t.id === form.value.creditTypeId);
    simResult.value = await creditStore.simulatePublic(slug.value, {
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      system: form.value.amortizationSystem,
      monthlyIncome: form.value.monthlyIncome || undefined,
    });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo simular', life: 4000 });
  } finally {
    simulating.value = false;
  }
}

function nextStep() {
  if (activeStep.value === 0) {
    if (!form.value.clientName) return toast.add({ severity: 'warn', summary: 'Ingrese su nombre', life: 3000 });
    if (!checkCedula(form.value.idNumber)) return;
  }
  if (activeStep.value === 1 && !simResult.value) {
    return toast.add({ severity: 'warn', summary: 'Debe simular el crédito antes de continuar', life: 3000 });
  }
  activeStep.value++;
}

function onBiometricVerified(_descriptor: Float32Array) {
  biometricVerified.value = true;
  toast.add({ severity: 'success', summary: 'Identidad verificada', life: 3000 });
}

async function submit() {
  submitting.value = true;
  try {
    const payload = {
      clientName: form.value.clientName,
      idNumber: form.value.idNumber,
      clientEmail: form.value.clientEmail || undefined,
      clientPhone: form.value.clientPhone || undefined,
      creditTypeId: form.value.creditTypeId,
      amount: form.value.amount,
      termMonths: form.value.termMonths,
      amortizationSystem: simResult.value.summary.amortizationSystem,
      appliedRate: simResult.value.summary.annualRatePct,
      scheduleJson: simResult.value.rows,
      monthlyIncome: form.value.monthlyIncome || undefined,
    };
    const { data: app } = await api.post(`/public/${slug.value}/credit-applications`, payload);
    const docTypeMap: Record<string, string> = { cedula: 'cedula', utility: 'utility_bill', income: 'income_proof' };
    for (const [key, file] of Object.entries(docFiles.value)) {
      const form = new FormData();
      form.append('file', file);
      form.append('documentType', docTypeMap[key] ?? key);
      await api.post(`/public/${slug.value}/credit-applications/${app.id}/documents`, form).catch(() => {});
    }
    submitted.value = true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo enviar la solicitud', life: 4000 });
  } finally {
    submitting.value = false;
  }
}
</script>
