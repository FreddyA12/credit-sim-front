<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitud de Inversión</h1>
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
            <h2 class="text-lg font-semibold">Producto de inversión</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Producto</label>
                <Select v-model="form.productId" :options="products" optionLabel="name" optionValue="id" @change="simResult = null" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Monto (USD)</label>
                <InputNumber v-model="form.amount" :min="0" mode="currency" currency="USD" locale="es-EC" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Plazo (días)</label>
                <InputNumber v-model="form.termDays" :min="1" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">Origen de los fondos</label>
                <Select v-model="form.fundsOrigin" :options="fundsOptions" optionLabel="label" optionValue="value" />
              </div>
            </div>
            <Button label="Simular inversión" icon="pi pi-calculator" :loading="simulating" @click="runSimulation" />
            <div v-if="simResult" class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="font-semibold text-green-800 mb-2">Resultado de la simulación</p>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>Interés bruto: <strong>${{ simResult.summary.grossInterest?.toFixed(2) }}</strong></div>
                <div>Retención IR: <strong>${{ simResult.summary.irWithholding?.toFixed(2) }}</strong></div>
                <div>Interés neto: <strong>${{ simResult.summary.netInterest?.toFixed(2) }}</strong></div>
                <div>Al vencimiento: <strong>${{ simResult.summary.amountAtMaturity?.toFixed(2) }}</strong></div>
              </div>
            </div>
          </div>

          <div v-else-if="activeStep === 2" class="flex flex-col gap-4">
            <h2 class="text-lg font-semibold">Declaraciones y contrato</h2>
            <div class="border rounded-lg p-4 bg-yellow-50">
              <p class="font-semibold text-sm mb-2">Declaración UAFE — Prevención de Lavado de Activos</p>
              <div class="flex items-start gap-2">
                <Checkbox v-model="form.pepDeclared" :binary="true" inputId="pep" />
                <label for="pep" class="text-sm text-gray-700">
                  Declaro que no soy Persona Expuesta Políticamente (PEP) ni actúo en nombre de una, y que los recursos provienen de actividades lícitas. (UAFE — Ley de Prevención de Lavado de Activos, Art. 3)
                </label>
              </div>
            </div>
            <div class="border rounded-lg p-4 bg-blue-50">
              <p class="font-semibold text-sm mb-2">Contrato de depósito a plazo fijo</p>
              <p class="text-xs text-gray-600 mb-3">
                La retención del 2% sobre los rendimientos será aplicada en cumplimiento del Art. 37 LRTI. COSEDE garantiza su depósito hasta el límite vigente (Art. 330 COMF). Los datos personales son tratados conforme a la LOPDP.
              </p>
              <div class="flex items-start gap-2">
                <Checkbox v-model="contractAccepted" :binary="true" inputId="contract" />
                <label for="contract" class="text-sm text-gray-700">Acepto los términos y condiciones del contrato de depósito a plazo fijo.</label>
              </div>
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
            <Button v-if="activeStep === 3" label="Confirmar inversión" icon="pi pi-check" :loading="submitting"
              :disabled="!biometricVerified || !contractAccepted || !form.pepDeclared" @click="submit" class="ml-auto" />
          </div>
        </template>
      </Card>
    </div>

    <div v-else class="flex flex-col items-center gap-4 py-12">
      <i class="pi pi-check-circle text-green-500 text-6xl" />
      <h2 class="text-2xl font-bold">¡Inversión registrada!</h2>
      <p class="text-gray-500">Su solicitud de inversión ha sido enviada y está pendiente de activación.</p>
      <Button label="Consultar estado" icon="pi pi-search" @click="$router.push(`/${slug}/estado`)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import BiometricCapture from '../../components/BiometricCapture.vue';
import { useIdentityValidation } from '../../composables/useIdentityValidation';
import api from '../../services/api';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const toast = useToast();
const { cedulaError, checkCedula } = useIdentityValidation();

const products = ref<any[]>([]);
const submitting = ref(false);
const simulating = ref(false);
const submitted = ref(false);
const biometricVerified = ref(false);
const contractAccepted = ref(false);
const simResult = ref<any>(null);
const activeStep = ref(0);

const steps = [
  { label: 'Solicitante' },
  { label: 'Inversión' },
  { label: 'Declaraciones' },
  { label: 'Verificación' },
];

const fundsOptions = [
  { label: 'Ahorro personal', value: 'ahorro_personal' },
  { label: 'Salario / sueldo', value: 'salario' },
  { label: 'Actividad comercial', value: 'actividad_comercial' },
  { label: 'Herencia / donación', value: 'herencia_donacion' },
  { label: 'Venta de activos', value: 'venta_activos' },
  { label: 'Otro', value: 'otro' },
];

const form = ref({
  clientName: '',
  idNumber: '',
  clientPhone: '',
  clientEmail: '',
  productId: null as any,
  amount: 1000,
  termDays: 90,
  fundsOrigin: '',
  pepDeclared: false,
});

onMounted(async () => {
  const { data } = await api.get(`/public/${slug.value}/investment-products`);
  products.value = data;
});

async function runSimulation() {
  if (!form.value.productId) return toast.add({ severity: 'warn', summary: 'Seleccione un producto', life: 3000 });
  simulating.value = true;
  try {
    const { data } = await api.post(`/public/${slug.value}/simulate/investment`, {
      productId: form.value.productId,
      amount: form.value.amount,
      termDays: form.value.termDays,
    });
    simResult.value = data;
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
    return toast.add({ severity: 'warn', summary: 'Debe simular la inversión antes de continuar', life: 3000 });
  }
  if (activeStep.value === 2 && (!form.value.pepDeclared || !contractAccepted.value)) {
    return toast.add({ severity: 'warn', summary: 'Debe aceptar las declaraciones', life: 3000 });
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
      productId: form.value.productId,
      clientName: form.value.clientName,
      idNumber: form.value.idNumber,
      clientEmail: form.value.clientEmail || undefined,
      clientPhone: form.value.clientPhone || undefined,
      amount: form.value.amount,
      termDays: form.value.termDays,
      appliedRate: simResult.value.summary.annualRate,
      paymentFrequency: simResult.value.summary.paymentFrequency,
      grossInterest: simResult.value.summary.grossInterest,
      irWithholding: simResult.value.summary.irWithholding,
      netInterest: simResult.value.summary.netInterest,
      amountAtMaturity: simResult.value.summary.amountAtMaturity,
      projectionJson: simResult.value.projectionTable,
      fundsOrigin: form.value.fundsOrigin,
      pepDeclared: form.value.pepDeclared,
      contractSignIp: 'client',
    };
    const { data: app } = await api.post(`/public/${slug.value}/investment-applications`, payload);
    if (biometricVerified.value) {
      await api.post(`/public/${slug.value}/investment-applications/${app.id}/biometrics`, { validated: true, score: 0.9 }).catch(() => {});
    }
    submitted.value = true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo registrar', life: 4000 });
  } finally {
    submitting.value = false;
  }
}
</script>
