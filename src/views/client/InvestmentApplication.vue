<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitud de Inversión</h1>
    <div v-if="!submitted">
      <Steps :model="steps" :activeStep="activeStep" class="mb-6" />
      <Card>
        <template #content>
          <div v-if="activeStep === 0" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <h2 class="col-span-2 text-lg font-semibold">Datos del solicitante</h2>
            <p class="col-span-2 text-sm text-gray-500 -mt-2">
              Ingrese su cédula y adjunte un PDF con la copia de la cédula (ambos son obligatorios). El origen de los fondos se indica en el siguiente paso.
            </p>
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-medium">Nombre completo *</label>
              <InputText v-model="form.clientName" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-medium">Cédula de ciudadanía *</label>
              <InputText v-model="form.idNumber" @blur="checkCedula(form.idNumber)" :class="{ 'p-invalid': cedulaError }" maxlength="10" />
              <small class="text-red-500">{{ cedulaError }}</small>
            </div>
            <div class="flex flex-col gap-1 col-span-2">
              <label class="text-sm font-medium">Copia de cédula (PDF) *</label>
              <input
                type="file"
                accept="application/pdf,.pdf"
                class="block w-full text-sm text-gray-600 file:mr-3 file:rounded file:border file:border-gray-200 file:bg-white file:px-3 file:py-1.5 file:text-sm"
                @change="onCedulaPdfChange"
              />
              <small v-if="cedulaPdfName" class="text-xs text-green-700">{{ cedulaPdfName }}</small>
              <small class="text-xs text-gray-500">Solo archivo PDF, máximo 5 MB.</small>
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
                <InputNumber
                  v-model="form.amount"
                  :min="selectedProduct?.minAmount ?? 0"
                  :max="selectedProduct?.maxAmount ?? undefined"
                  mode="currency"
                  currency="USD"
                  locale="es-EC"
                  fluid
                />
                <small v-if="selectedProduct" class="text-xs text-gray-500">
                  Mín: ${{ selectedProduct.minAmount }}{{ selectedProduct.maxAmount != null ? ` — Máx: $${selectedProduct.maxAmount}` : '' }}
                </small>
                <small v-else class="text-xs text-gray-500">Seleccione un producto para ver los límites.</small>
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
                />
                <small v-if="selectedProduct" class="text-xs text-gray-500">Mín: {{ termMin }} — Máx: {{ termMax }} días</small>
                <small v-else class="text-xs text-gray-500">Seleccione un producto para ver los límites.</small>
              </div>
              <div class="flex flex-col gap-1 md:col-span-2">
                <label class="text-sm font-medium">Origen de los fondos *</label>
                <Select v-model="form.fundsOrigin" :options="fundsOptions" optionLabel="label" optionValue="value" placeholder="Seleccione..." />
              </div>
            </div>
          </div>

          <div v-else-if="activeStep === 2" class="flex flex-col gap-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900">Resumen de su inversión</h2>
              <p class="text-sm text-gray-600 mt-1">
                Revise el monto, la tasa, la periodicidad del pago de intereses y la proyección. Luego acepte las declaraciones al final de esta pantalla.
              </p>
            </div>

            <div
              v-if="simResult && selectedProduct"
              class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div class="flex flex-wrap gap-4 text-sm text-gray-700">
                <span><strong>{{ selectedProduct.name }}</strong></span>
                <span>Monto: <strong>${{ Number(form.amount ?? 0).toFixed(2) }}</strong></span>
                <span>Plazo: <strong>{{ form.termDays }} días</strong></span>
                <span>Tasa: <strong>{{ simResult.summary?.annualRate != null ? simResult.summary.annualRate + '%' : '—' }}</strong></span>
                <span>Pago de intereses: <strong>{{ paymentFrequencyLabel(selectedProduct.paymentFrequency) }}</strong></span>
              </div>
              <div class="flex flex-wrap gap-2 sm:ml-4">
                <Button label="Modificar" icon="pi pi-pencil" severity="secondary" size="small" @click="activeStep = 1" />
                <Button label="Descargar PDF" icon="pi pi-download" severity="info" size="small" @click="downloadInvestmentPdf" />
              </div>
            </div>

            <div v-if="simResult" class="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div
                v-for="item in summaryItems"
                :key="item.label"
                class="rounded-lg border border-gray-100 bg-white p-4 shadow-sm"
              >
                <p class="text-xs text-gray-500">{{ item.label }}</p>
                <p class="text-xl font-bold text-gray-800">{{ item.value }}</p>
              </div>
            </div>

            <Card v-if="simResult">
              <template #title>
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>Detalle de la inversión y pagos</span>
                  <PdfDownloadButton label="Descargar PDF" @download="downloadInvestmentPdf" />
                </div>
              </template>
              <template #content>
                <div class="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
                  <div><span class="font-medium">Monto invertido:</span> ${{ simResult.summary?.amount?.toFixed(2) }}</div>
                  <div><span class="font-medium">Tasa anual:</span> {{ simResult.summary?.annualRate }}%</div>
                  <div><span class="font-medium">Plazo:</span> {{ simResult.summary?.termDays }} días</div>
                  <div>
                    <span class="font-medium">Pago de intereses:</span>
                    {{ paymentFrequencyLabel(selectedProduct?.paymentFrequency) }}
                  </div>
                  <div><span class="font-medium">Interés bruto:</span> ${{ simResult.summary?.grossInterest?.toFixed(2) }}</div>
                  <div><span class="font-medium">Retención IR (2%):</span> ${{ simResult.summary?.irWithholding?.toFixed(2) }}</div>
                  <div><span class="font-medium">Interés neto:</span> ${{ simResult.summary?.netInterest?.toFixed(2) }}</div>
                  <div><span class="font-medium">Total al vencimiento:</span> ${{ simResult.summary?.amountAtMaturity?.toFixed(2) }}</div>
                </div>
                <p class="mt-4 text-xs text-gray-500">
                  Los intereses se acreditan según la periodicidad del producto (mensual, trimestral, al vencimiento, etc.).
                  La retención del 2% se aplica sobre los rendimientos según la normativa vigente.
                </p>
              </template>
            </Card>

            <Card v-if="simResult?.projectionTable?.length">
              <template #title>Proyección período a período</template>
              <template #content>
                <DataTable :value="simResult.projectionTable" striped responsive-layout="scroll" class="text-sm">
                  <Column field="period" header="Período" :sortable="true" />
                  <Column field="accumulatedDays" header="Días acumulados" :sortable="true" />
                  <Column field="grossInterest" header="Interés bruto">
                    <template #body="{ data }">${{ data.grossInterest?.toFixed(2) }}</template>
                  </Column>
                  <Column field="irWithholding" header="Retención IR (2%)">
                    <template #body="{ data }">${{ data.irWithholding?.toFixed(2) }}</template>
                  </Column>
                  <Column field="netInterest" header="Interés neto">
                    <template #body="{ data }">${{ data.netInterest?.toFixed(2) }}</template>
                  </Column>
                  <Column field="totalAtMaturity" header="Total al vencimiento">
                    <template #body="{ data }">
                      <span v-if="data.totalAtMaturity" class="font-bold text-gray-900">${{ data.totalAtMaturity?.toFixed(2) }}</span>
                      <span v-else class="text-gray-400">—</span>
                    </template>
                  </Column>
                </DataTable>
              </template>
            </Card>

            <LegalNote
              text="Retención del 2% sobre rendimientos financieros (LRTI Art. 37, Reg. Art. 131). COSEDE garantiza depósitos hasta el límite vigente (Art. 330 COMF). Simulación informativa."
            />

            <div>
              <h2 class="text-lg font-semibold text-gray-900">Declaraciones y contrato</h2>
              <p class="text-sm text-gray-600 mb-3">Debe aceptar lo siguiente para continuar a la verificación biométrica.</p>
            </div>
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
            <Button
              v-if="activeStep < 3"
              label="Siguiente"
              icon="pi pi-arrow-right"
              iconPos="right"
              :loading="activeStep === 1 && simulating"
              :disabled="activeStep === 1 && simulating"
              @click="nextStep"
              class="ml-auto"
            />
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
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Steps from 'primevue/steps';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Select from 'primevue/select';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import BiometricCapture from '../../components/BiometricCapture.vue';
import LegalNote from '../../components/LegalNote.vue';
import PdfDownloadButton from '../../components/PdfDownloadButton.vue';
import { useIdentityValidation } from '../../composables/useIdentityValidation';
import { usePdf } from '../../composables/usePdf';
import { useInstitutionStore } from '../../stores/institution.store';
import { formatCurrency } from '../../utils/financial-calculations';
import { paymentFrequencyLabel } from '../../utils/investment-payment-frequency';
import api from '../../services/api';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const toast = useToast();
const { cedulaError, checkCedula } = useIdentityValidation();
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const { generateInvestmentPdf } = usePdf();

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
  { label: 'Resumen y declaraciones' },
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

const cedulaPdfFile = ref<File | null>(null);
const cedulaPdfName = ref('');

const state = history.state ?? {};
const form = ref({
  clientName: '',
  idNumber: '',
  clientPhone: '',
  clientEmail: '',
  productId: state.productId ?? null,
  amount: state.amount ?? null,
  termDays: state.termDays ?? null,
  fundsOrigin: '',
  pepDeclared: false,
});

function onCedulaPdfChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) {
    cedulaPdfFile.value = null;
    cedulaPdfName.value = '';
    return;
  }
  if (file.type !== 'application/pdf') {
    cedulaPdfFile.value = null;
    cedulaPdfName.value = '';
    input.value = '';
    toast.add({ severity: 'warn', summary: 'Solo se admite PDF', detail: 'Suba un archivo .pdf con la copia de su cédula.', life: 4000 });
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    cedulaPdfFile.value = null;
    cedulaPdfName.value = '';
    input.value = '';
    toast.add({ severity: 'warn', summary: 'Archivo demasiado grande', detail: 'Máximo 5 MB.', life: 3000 });
    return;
  }
  cedulaPdfFile.value = file;
  cedulaPdfName.value = file.name;
}

const selectedProduct = computed(() => products.value.find((p) => p.id === form.value.productId) ?? null);

const termMin = computed(() => (selectedProduct.value ? Number(selectedProduct.value.minTermDays) : 1));
const termMax = computed(() => (selectedProduct.value ? Number(selectedProduct.value.maxTermDays) : 36500));

const summaryItems = computed(() => {
  if (!simResult.value?.summary) return [];
  const s = simResult.value.summary;
  return [
    { label: 'Interés bruto', value: formatCurrency(s.grossInterest) },
    { label: 'Retención IR', value: formatCurrency(s.irWithholding) },
    { label: 'Interés neto', value: formatCurrency(s.netInterest) },
    { label: 'Al vencimiento', value: formatCurrency(s.amountAtMaturity) },
  ];
});

function downloadInvestmentPdf() {
  if (!simResult.value?.summary) return;
  generateInvestmentPdf(simResult.value.summary, institution.value);
}

onMounted(async () => {
  const { data } = await api.get(`/public/${slug.value}/investment-products`);
  products.value = data;
});

async function runSimulation(): Promise<boolean> {
  if (!form.value.productId) {
    toast.add({ severity: 'warn', summary: 'Seleccione un producto', life: 3000 });
    return false;
  }
  const product = products.value.find((p) => p.id === form.value.productId);
  if (form.value.amount == null) {
    toast.add({ severity: 'warn', summary: 'Indique el monto a invertir', life: 3000 });
    return false;
  }
  if (form.value.termDays == null) {
    toast.add({ severity: 'warn', summary: 'Indique el plazo en días', life: 3000 });
    return false;
  }
  const td = Math.round(Number(form.value.termDays));
  if (!Number.isFinite(td)) {
    toast.add({ severity: 'warn', summary: 'Plazo inválido', life: 3000 });
    return false;
  }
  const tMin = product ? Number(product.minTermDays) : 1;
  const tMax = product ? Number(product.maxTermDays) : 36500;
  if (td < tMin || td > tMax) {
    toast.add({
      severity: 'warn',
      summary: `El plazo debe estar entre ${tMin} y ${tMax} días`,
      life: 4000,
    });
    return false;
  }
  if (product) {
    const amt = Number(form.value.amount);
    if (amt < product.minAmount || (product.maxAmount != null && amt > product.maxAmount)) {
      toast.add({
        severity: 'warn',
        summary: `Monto debe ser mínimo $${product.minAmount}${product.maxAmount != null ? ` y máximo $${product.maxAmount}` : ''}`,
        life: 3000,
      });
      return false;
    }
  }
  form.value.termDays = td;
  simulating.value = true;
  try {
    const { data } = await api.post(`/public/${slug.value}/simulate/investment`, {
      productId: form.value.productId,
      amount: form.value.amount,
      termDays: td,
      paymentFrequency: product?.paymentFrequency || 'at_maturity',
    });
    simResult.value = data;
    return true;
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo simular', life: 4000 });
    return false;
  } finally {
    simulating.value = false;
  }
}

async function nextStep() {
  if (activeStep.value === 0) {
    if (!form.value.clientName) return toast.add({ severity: 'warn', summary: 'Ingrese su nombre', life: 3000 });
    if (!checkCedula(form.value.idNumber)) return;
    if (!cedulaPdfFile.value) {
      return toast.add({ severity: 'warn', summary: 'Adjunte el PDF con la copia de su cédula', life: 3000 });
    }
  }
  if (activeStep.value === 1) {
    if (!form.value.fundsOrigin) {
      return toast.add({ severity: 'warn', summary: 'Seleccione el origen de los fondos', life: 3000 });
    }
    const ok = await runSimulation();
    if (!ok) return;
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
    if (cedulaPdfFile.value) {
      const fd = new FormData();
      fd.append('file', cedulaPdfFile.value);
      await api.post(`/public/${slug.value}/investment-applications/${app.id}/documents`, fd).catch(() => {
        toast.add({
          severity: 'warn',
          summary: 'Solicitud registrada',
          detail: 'No se pudo subir el PDF de la cédula. Contacte a la institución.',
          life: 5000,
        });
      });
    }
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
