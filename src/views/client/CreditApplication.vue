<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitud de Crédito</h1>
    <div v-if="!submitted">
      <Steps :model="steps" :activeStep="activeStep" class="mb-6" />

      <Card>
        <template #content>
          <div v-if="activeStep === 0" class="flex flex-col gap-6">
            <h2 class="text-lg font-semibold">Datos del solicitante</h2>

            <!-- Si NO viene del simulador, primero debe seleccionar el tipo de crédito -->
            <div v-if="!comesFromSimulator" class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label class="text-sm font-medium text-yellow-900 mb-2 block">
                <i class="pi pi-info-circle mr-1"></i>
                Primero seleccione el tipo de crédito que desea solicitar *
              </label>
              <Select
                v-model="form.creditTypeId"
                :options="creditTypes"
                optionLabel="name"
                optionValue="id"
                placeholder="Seleccione un tipo de crédito..."
                class="w-full"
              />
            </div>

            <!-- Si YA viene del simulador, mostrar tipo seleccionado (no editable) -->
            <div v-else class="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p class="text-sm text-blue-900">
                <i class="pi pi-check-circle mr-1"></i>
                Tipo de crédito seleccionado: <strong>{{ selectedCreditType?.name }}</strong>
              </p>
            </div>

            <!-- Formulario de datos personales (solo se muestra si ya hay tipo seleccionado) -->
            <div v-if="form.creditTypeId" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex flex-col gap-1 col-span-2">
                <label class="text-sm font-medium">Nombre completo *</label>
                <InputText v-model="form.clientName" />
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-sm font-medium">{{ idLabel }} *</label>
                <InputText
                  v-model="form.idNumber"
                  @blur="validateIdNumber"
                  :class="{ 'p-invalid': idError }"
                  :maxlength="idMaxLength"
                  :placeholder="idPlaceholder"
                />
                <small class="text-red-500">{{ idError }}</small>
                <small v-if="selectedCreditType" class="text-gray-500">
                  {{ selectedCreditType.idType === 'ruc' ? 'Ingrese su RUC de 13 dígitos' : 'Ingrese su cédula de 10 dígitos' }}
                </small>
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

            <!-- Mensaje si aún no seleccionó tipo de crédito -->
            <div v-else class="text-center text-gray-500 py-8">
              <i class="pi pi-arrow-up text-3xl mb-2"></i>
              <p>Seleccione un tipo de crédito para continuar</p>
            </div>
          </div>

          <div v-else-if="activeStep === 1" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Panel 1: Análisis de Capacidad de Pago -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 h-fit">
              <h2 class="text-lg font-semibold text-blue-900 mb-4">
                <i class="pi pi-chart-line mr-2"></i>Análisis de Capacidad de Pago
              </h2>
              <div class="grid grid-cols-1 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Ingresos netos mensuales (USD) *</label>
                  <InputNumber v-model="form.monthlyIncome" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Gastos mensuales fijos (USD)</label>
                  <InputNumber v-model="form.monthlyExpenses" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                  <small class="text-gray-500">Alimentación, servicios, arriendo, etc.</small>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Otras deudas mensuales (USD)</label>
                  <InputNumber v-model="form.otherDebts" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                  <small class="text-gray-500">Cuotas de otros créditos, tarjetas, etc.</small>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Patrimonio neto total (USD)</label>
                  <InputNumber v-model="form.netWorth" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                  <small class="text-gray-500">Bienes, ahorros, inversiones menos deudas</small>
                </div>
              </div>

              <!-- Resultado de capacidad de pago -->
              <div v-if="paymentCapacity !== null" class="mt-4 p-3 bg-white border border-blue-300 rounded">
                <p class="text-sm font-semibold text-blue-900">
                  <i class="pi pi-info-circle mr-1"></i>
                  Según su situación financiera, puede pagar hasta:
                </p>
                <p class="text-2xl font-bold text-blue-700 mt-1">${{ paymentCapacity.toFixed(2) }} USD/mes</p>
                <small class="text-gray-600">
                  Cálculo: (Ingresos ${{ (form.monthlyIncome || 0).toFixed(2) }} - Gastos ${{ (form.monthlyExpenses || 0).toFixed(2) }} - Otras deudas ${{ (form.otherDebts || 0).toFixed(2) }}) × 40%
                </small>
              </div>
            </div>

            <!-- Panel 2: Detalle del Crédito -->
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 h-fit">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">
                <i class="pi pi-credit-card mr-2"></i>Detalle del Crédito
              </h2>
              <div class="grid grid-cols-1 gap-4">
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Tipo de crédito *</label>
                  <Select
                    v-model="form.creditTypeId"
                    :options="creditTypes"
                    optionLabel="name"
                    optionValue="id"
                    @change="simResult = null"
                    disabled
                  />
                  <small class="text-gray-500">El tipo de crédito se seleccionó en el Paso 1</small>
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Monto solicitado (USD) *</label>
                  <InputNumber v-model="form.amount" :min="0" mode="currency" currency="USD" locale="es-EC" fluid />
                </div>
                <div class="flex flex-col gap-1">
                  <label class="text-sm font-medium">Plazo (meses) *</label>
                  <InputNumber v-model="form.termMonths" :min="1" :max="360" fluid />
                </div>
              </div>
              <Button label="Simular crédito" icon="pi pi-calculator" :loading="simulating" @click="runSimulation" class="mt-4" />

              <!-- Resultado de simulación -->
              <div v-if="simResult" class="mt-4">
                <div :class="exceedsCapacity ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'" class="border rounded-lg p-4">
                  <p :class="exceedsCapacity ? 'text-red-800' : 'text-green-800'" class="font-semibold mb-2">
                    <i :class="exceedsCapacity ? 'pi pi-times-circle' : 'pi pi-check-circle'" class="mr-1"></i>
                    {{ exceedsCapacity ? 'Simulación NO aprobada' : 'Resultado de la simulación' }}
                  </p>
                  <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>{{ simResult.summary.amortizationSystem === 'french' ? 'Cuota mensual' : 'Primera cuota' }}: <strong>${{ simResult.summary.firstInstallment?.toFixed(2) }}</strong></div>
                    <div>Tasa aplicada: <strong>{{ simResult.summary.annualRatePct }}%</strong></div>
                    <div>Total a pagar: <strong>${{ simResult.summary.totalCreditCost?.toFixed(2) }}</strong></div>
                    <div>Total intereses: <strong>${{ simResult.summary.totalInterest?.toFixed(2) }}</strong></div>
                  </div>

                  <!-- Alerta si excede capacidad -->
                  <div v-if="exceedsCapacity" class="mt-3 p-3 bg-red-100 border border-red-400 rounded">
                    <p class="text-sm font-semibold text-red-900">
                      <i class="pi pi-exclamation-triangle mr-1"></i>
                      La cuota mensual (${{ simResult.summary.firstInstallment?.toFixed(2) }}) supera su capacidad de pago (${{ paymentCapacity?.toFixed(2) }})
                    </p>
                    <p class="text-xs text-red-700 mt-1">Por favor, reduzca el monto solicitado o aumente el plazo.</p>
                  </div>
                </div>
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
            <p class="text-sm text-gray-600">Coloque su rostro frente a la cámara y sostenga su cédula debajo. El sistema verificará que el número coincida con el ingresado.</p>
            <BiometricCapture :expectedCedula="form.idNumber" @verified="onBiometricVerified" />
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
const { cedulaError, rucError, checkCedula, checkRuc } = useIdentityValidation();

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
  monthlyExpenses: null,
  otherDebts: null,
  netWorth: null,
  amortizationSystem: state.amortizationSystem ?? 'french',
});

// Calcular capacidad de pago (40% del ingreso disponible)
const paymentCapacity = computed(() => {
  const income = form.value.monthlyIncome || 0;
  const expenses = form.value.monthlyExpenses || 0;
  const debts = form.value.otherDebts || 0;

  if (income <= 0) return null;

  const availableIncome = income - expenses - debts;
  return availableIncome > 0 ? availableIncome * 0.4 : 0;
});

// Detectar si viene del simulador (si tiene creditTypeId en el state)
const comesFromSimulator = computed(() => {
  return !!state.creditTypeId;
});

// Verificar si la cuota excede la capacidad de pago
const exceedsCapacity = computed(() => {
  if (!simResult.value || paymentCapacity.value === null) return false;
  const installment = simResult.value.summary.firstInstallment || 0;
  return installment > paymentCapacity.value;
});

// Obtener el tipo de crédito seleccionado en el Panel 2
const selectedCreditType = computed(() => {
  return creditTypes.value.find((t) => t.id === form.value.creditTypeId);
});

// Tipo de identificación requerida según el tipo de crédito
const requiredIdType = computed(() => {
  return selectedCreditType.value?.idType || 'cedula';
});

// Label dinámico del campo de identificación
const idLabel = computed(() => {
  const idType = requiredIdType.value;
  if (idType === 'ruc') return 'RUC (Registro Único de Contribuyentes)';
  if (idType === 'both') return 'Cédula o RUC';
  return 'Cédula de identidad';
});

// Longitud máxima del campo
const idMaxLength = computed(() => {
  return requiredIdType.value === 'ruc' ? 13 : (requiredIdType.value === 'both' ? 13 : 10);
});

// Placeholder del campo
const idPlaceholder = computed(() => {
  const idType = requiredIdType.value;
  if (idType === 'ruc') return '1234567890001';
  if (idType === 'both') return '1234567890 o 1234567890001';
  return '1234567890';
});

// Error de validación (cédula o RUC)
const idError = computed(() => {
  return requiredIdType.value === 'ruc' ? rucError.value : cedulaError.value;
});

// Función de validación que llama a checkCedula o checkRuc según corresponda
function validateIdNumber() {
  const idType = requiredIdType.value;
  const value = form.value.idNumber;

  if (idType === 'ruc') {
    return checkRuc(value);
  } else if (idType === 'both') {
    // Si acepta ambos, intentar validar según la longitud
    if (value.length === 13) {
      return checkRuc(value);
    } else {
      return checkCedula(value);
    }
  } else {
    return checkCedula(value);
  }
}

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
    if (!form.value.creditTypeId) {
      return toast.add({ severity: 'warn', summary: 'Seleccione un tipo de crédito', life: 3000 });
    }
    if (!form.value.clientName) {
      return toast.add({ severity: 'warn', summary: 'Ingrese su nombre', life: 3000 });
    }
    if (!validateIdNumber()) return;
  }
  if (activeStep.value === 1) {
    if (!form.value.monthlyIncome || form.value.monthlyIncome <= 0) {
      return toast.add({ severity: 'warn', summary: 'Ingrese sus ingresos mensuales', life: 3000 });
    }
    if (!simResult.value) {
      return toast.add({ severity: 'warn', summary: 'Debe simular el crédito antes de continuar', life: 3000 });
    }
    if (exceedsCapacity.value) {
      return toast.add({
        severity: 'error',
        summary: 'Capacidad de pago insuficiente',
        detail: `La cuota mensual ($${simResult.value.summary.firstInstallment?.toFixed(2)}) supera su capacidad de pago ($${paymentCapacity.value?.toFixed(2)}). Ajuste el monto o plazo.`,
        life: 5000
      });
    }
  }
  activeStep.value++;
}

function onBiometricVerified() {
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
      monthlyExpenses: form.value.monthlyExpenses || undefined,
      otherDebts: form.value.otherDebts || undefined,
      netWorth: form.value.netWorth || undefined,
      maxPaymentCalc: paymentCapacity.value || undefined,
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
