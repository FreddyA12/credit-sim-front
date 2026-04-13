<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Inversión</h1>
    <DataTable :value="applications" :loading="loading" stripedRows paginator :rows="10">
      <Column field="id" header="ID" :sortable="true" />
      <Column header="Inversor">
        <template #body="{ data }">{{ data.clientName }}</template>
      </Column>
      <Column header="Cédula">
        <template #body="{ data }">{{ data.idNumber }}</template>
      </Column>
      <Column header="Producto">
        <template #body="{ data }">{{ productName(data) }}</template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">${{ formatNumber(data.amount) }}</template>
      </Column>
      <Column field="termDays" header="Plazo (días)" />
      <Column header="Interés bruto">
        <template #body="{ data }">${{ formatNumber(data.grossInterest) }}</template>
      </Column>
      <Column header="Retención IR">
        <template #body="{ data }">${{ formatNumber(data.irWithholding) }}</template>
      </Column>
      <Column header="Interés neto">
        <template #body="{ data }">${{ formatNumber(data.netInterest) }}</template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Cambiar estado">
        <template #body="{ data }">
          <Select v-model="data.status" :options="statusOptions" optionLabel="label" optionValue="value" class="text-sm" @change="updateStatus(data)" />
        </template>
      </Column>
      <Column header="Acciones">
        <template #body="{ data }">
          <Button icon="pi pi-eye" size="small" severity="info" text rounded @click="viewDetail(data)" v-tooltip.top="'Ver detalle'" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog de detalle -->
    <Dialog v-model:visible="detailVisible" modal header="Detalle de Solicitud de Inversión" :style="{ width: '90vw', maxWidth: '1200px' }" :closable="true" @hide="onDetailHide">
      <div v-if="detailLoading" class="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
        <i class="pi pi-spinner animate-spin text-3xl text-gray-400" />
        <span>Cargando detalle…</span>
      </div>
      <Tabs v-else-if="selectedApp" value="0">
        <TabList>
          <Tab value="0">Información general</Tab>
          <Tab value="1">Proyección financiera</Tab>
          <Tab value="2">Validación y documento</Tab>
          <Tab value="3">Notas</Tab>
        </TabList>

        <TabPanels>
          <!-- Tab 1: Información General -->
          <TabPanel value="0">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div class="bg-gray-50 p-4 rounded">
                <h3 class="font-bold text-gray-700 mb-3">Datos del Inversor</h3>
                <div class="space-y-2">
                  <div><span class="font-medium">Nombre:</span> {{ selectedApp.clientName }}</div>
                  <div><span class="font-medium">Cédula/RUC:</span> {{ selectedApp.idNumber }}</div>
                  <div><span class="font-medium">Email:</span> {{ selectedApp.clientEmail || 'No proporcionado' }}</div>
                  <div><span class="font-medium">Teléfono:</span> {{ selectedApp.clientPhone || 'No proporcionado' }}</div>
                  <div><span class="font-medium">Tipo:</span> {{ selectedApp.applicantType || 'No especificado' }}</div>
                </div>
              </div>

              <div class="bg-gray-50 p-4 rounded">
                <h3 class="font-bold text-gray-700 mb-3">Detalles del Producto</h3>
                <div class="space-y-2">
                  <div><span class="font-medium">Producto:</span> {{ selectedApp.product?.name }}</div>
                  <div><span class="font-medium">Monto:</span> ${{ formatNumber(selectedApp.amount) }}</div>
                  <div><span class="font-medium">Plazo:</span> {{ selectedApp.termDays }} días</div>
                  <div><span class="font-medium">Tasa aplicada:</span> {{ fmtRate(selectedApp.appliedRate) }}</div>
                  <div><span class="font-medium">Frecuencia de pago:</span> {{ paymentFrequencyLabel(selectedApp.paymentFrequency) }}</div>
                </div>
              </div>

              <div class="bg-green-50 p-4 rounded md:col-span-2">
                <h3 class="font-bold text-gray-700 mb-3">Cálculos Financieros</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><span class="font-medium">Interés bruto:</span> ${{ formatNumber(selectedApp.grossInterest) }}</div>
                  <div><span class="font-medium">Retención IR:</span> ${{ formatNumber(selectedApp.irWithholding) }}</div>
                  <div><span class="font-medium">Interés neto:</span> ${{ formatNumber(selectedApp.netInterest) }}</div>
                  <div><span class="font-medium">Al vencimiento:</span> <strong class="text-green-700">${{ formatNumber(selectedApp.amountAtMaturity) }}</strong></div>
                </div>
              </div>

              <div class="bg-blue-50 p-4 rounded md:col-span-2">
                <h3 class="font-bold text-gray-700 mb-3">Información Adicional</h3>
                <div class="space-y-2">
                  <div><span class="font-medium">Fecha de solicitud:</span> {{ new Date(selectedApp.createdAt).toLocaleString('es-EC') }}</div>
                  <div v-if="selectedApp.contractSignedAt"><span class="font-medium">Firmado el:</span> {{ new Date(selectedApp.contractSignedAt).toLocaleString('es-EC') }}</div>
                  <div v-if="selectedApp.contractSignIp"><span class="font-medium">IP de firma:</span> {{ selectedApp.contractSignIp }}</div>
                  <div v-if="selectedApp.fundsOrigin"><span class="font-medium">Origen de fondos:</span> {{ fundsOriginLabel(selectedApp.fundsOrigin) }}</div>
                  <p v-if="selectedApp.cedulaCopyUrl" class="text-xs text-gray-500 mt-2">
                    Hay copia de cédula adjunta. Revísela en la pestaña «Validación y documento».
                  </p>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Tab 2: Proyección Financiera -->
          <TabPanel value="1">
            <div v-if="selectedApp.projectionJson && Array.isArray(selectedApp.projectionJson)" class="mt-2">
              <DataTable :value="selectedApp.projectionJson" striped responsive-layout="scroll" class="text-sm">
                <Column field="period" header="Período" :sortable="true"></Column>
                <Column field="accumulatedDays" header="Días acumulados" :sortable="true"></Column>
                <Column field="grossInterest" header="Interés bruto">
                  <template #body="{ data }">
                    ${{ formatNumber(data.grossInterest) }}
                  </template>
                </Column>
                <Column field="irWithholding" header="Retención IR (2%)">
                  <template #body="{ data }">
                    ${{ formatNumber(data.irWithholding) }}
                  </template>
                </Column>
                <Column field="netInterest" header="Interés neto">
                  <template #body="{ data }">
                    ${{ formatNumber(data.netInterest) }}
                  </template>
                </Column>
                <Column field="totalAtMaturity" header="Total al vencimiento">
                  <template #body="{ data }">
                    <span v-if="data.totalAtMaturity" class="font-bold text-green-600">
                      ${{ formatNumber(data.totalAtMaturity) }}
                    </span>
                    <span v-else class="text-gray-400">—</span>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="p-4 text-center text-gray-500">
              <i class="pi pi-info-circle mr-2"></i>
              No hay tabla de proyección disponible para esta solicitud.
            </div>
          </TabPanel>

          <!-- Tab 3: Validación y documento -->
          <TabPanel value="2">
            <div class="space-y-4">
              <p class="text-sm text-gray-600 leading-relaxed">
                Aquí concentra el control normativo: la biometría acredita que la persona pasó la verificación facial;
                la declaración PEP cumple el requisito UAFE (lavado de activos); la copia de cédula es el respaldo documental del número ingresado.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div class="flex items-start gap-3">
                    <i :class="selectedApp.biometricsValidated ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-500'" class="text-2xl shrink-0 mt-0.5" />
                    <div>
                      <div class="text-sm font-semibold text-gray-800">Biometría</div>
                      <p class="text-xs text-gray-600 mt-1">
                        {{ selectedApp.biometricsValidated ? 'Identidad verificada con captura biométrica.' : 'Aún no validada o no completada por el cliente.' }}
                      </p>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div class="flex items-start gap-3">
                    <i :class="selectedApp.pepDeclared ? 'pi pi-shield text-blue-600' : 'pi pi-exclamation-circle text-amber-600'" class="text-2xl shrink-0 mt-0.5" />
                    <div>
                      <div class="text-sm font-semibold text-gray-800">Declaración PEP (UAFE)</div>
                      <p class="text-xs text-gray-600 mt-1">
                        {{ selectedApp.pepDeclared
                          ? 'El cliente declaró que no es persona políticamente expuesta (PEP) y que el origen de los fondos es lícito.'
                          : 'No consta la aceptación de la declaración; revise la solicitud.' }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="bg-white p-4 rounded-lg border border-gray-200">
                <h4 class="text-sm font-semibold text-gray-800 mb-2">Copia de cédula</h4>
                <p v-if="!selectedApp.cedulaCopyUrl" class="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2">
                  No hay archivo adjunto para esta solicitud.
                </p>
                <div v-else class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div class="text-sm text-gray-700">
                    <span class="font-medium">Archivo:</span>
                    {{ selectedApp.cedulaCopyOriginalName || 'documento.pdf' }}
                    <span v-if="selectedApp.cedulaCopySizeBytes" class="text-xs text-gray-500 block mt-0.5">
                      {{ formatFileSize(selectedApp.cedulaCopySizeBytes) }}
                    </span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <Button
                      label="Previsualizar"
                      icon="pi pi-eye"
                      size="small"
                      @click="openCedulaPreview"
                    />
                    <Button
                      label="Nueva pestaña"
                      icon="pi pi-external-link"
                      severity="secondary"
                      size="small"
                      @click="openCedulaInNewTab"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- Tab 4: Notas -->
          <TabPanel value="3">
            <div class="space-y-3">
              <Textarea v-model="selectedApp.notes" rows="8" class="w-full" placeholder="Agregar notas sobre esta solicitud..." />
              <div class="flex justify-end">
                <Button label="Guardar notas" icon="pi pi-save" @click="saveNotes" :loading="savingNotes" />
              </div>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Dialog>

    <Dialog
      v-model:visible="cedulaPreviewVisible"
      modal
      header="Vista previa — copia de cédula"
      :style="{ width: 'min(96vw, 1100px)' }"
      @hide="cedulaPreviewUrl = ''"
    >
      <iframe
        v-if="cedulaPreviewUrl"
        :src="cedulaPreviewUrl"
        title="Vista previa copia de cédula"
        class="w-full border-0 bg-gray-100"
        style="height: min(78vh, 720px)"
      />
      <p v-else class="p-6 text-sm text-gray-500">No hay archivo para mostrar.</p>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import Textarea from 'primevue/textarea';
import api from '../../services/api';
import { paymentFrequencyLabel } from '../../utils/investment-payment-frequency';
import { formatNumber } from '../../utils/number-utils';

const toast = useToast();
const applications = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const selectedApp = ref<any>(null);
const savingNotes = ref(false);
const cedulaPreviewVisible = ref(false);
const cedulaPreviewUrl = ref('');

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Activo', value: 'active' },
  { label: 'Vencido', value: 'matured' },
  { label: 'Cancelado', value: 'cancelled' },
];

function fmtMoney(val: unknown): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : '—';
}

function fmtRate(val: unknown): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isFinite(n) ? `${n}%` : '—';
}

const FUNDS_ORIGIN_LABELS: Record<string, string> = {
  ahorro_personal: 'Ahorro personal',
  salario: 'Salario / sueldo',
  actividad_comercial: 'Actividad comercial',
  herencia_donacion: 'Herencia / donación',
  venta_activos: 'Venta de activos',
  otro: 'Otro',
};

function fundsOriginLabel(v: string | null | undefined): string {
  if (!v) return '—';
  return FUNDS_ORIGIN_LABELS[v] ?? v;
}

function uploadHref(path: string): string {
  if (!path) return '#';
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

function productName(app: any): string {
  const n = app?.product?.name;
  return typeof n === 'string' && n.trim() ? n.trim() : '—';
}

function formatFileSize(bytes: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function openCedulaPreview() {
  if (!selectedApp.value?.cedulaCopyUrl) return;
  cedulaPreviewUrl.value = uploadHref(selectedApp.value.cedulaCopyUrl);
  cedulaPreviewVisible.value = true;
}

function openCedulaInNewTab() {
  if (!selectedApp.value?.cedulaCopyUrl) return;
  window.open(uploadHref(selectedApp.value.cedulaCopyUrl), '_blank', 'noopener,noreferrer');
}

function onDetailHide() {
  selectedApp.value = null;
  cedulaPreviewVisible.value = false;
  cedulaPreviewUrl.value = '';
}

function statusLabel(s: string) { return statusOptions.find((o) => o.value === s)?.label ?? s; }
function statusSeverity(s: string) {
  const map: Record<string, string> = { pending: 'warn', active: 'success', matured: 'info', cancelled: 'danger' };
  return map[s] ?? 'secondary';
}

async function viewDetail(app: any) {
  detailVisible.value = true;
  selectedApp.value = null;
  detailLoading.value = true;
  try {
    const { data } = await api.get(`/investment-applications/${app.id}`);
    selectedApp.value = data;
    const idx = applications.value.findIndex((a) => a.id === app.id);
    if (idx !== -1) {
      applications.value[idx] = { ...applications.value[idx], ...data, product: data.product };
    }
  } catch {
    toast.add({ severity: 'warn', summary: 'No se pudo cargar el detalle completo', detail: 'Mostrando datos de la tabla.', life: 4000 });
    selectedApp.value = { ...app };
  } finally {
    detailLoading.value = false;
  }
}

async function saveNotes() {
  if (!selectedApp.value) return;
  savingNotes.value = true;
  try {
    await api.put(`/investment-applications/${selectedApp.value.id}/status`, {
      status: selectedApp.value.status,
      notes: selectedApp.value.notes,
    });
    toast.add({ severity: 'success', summary: 'Notas guardadas', life: 2000 });
    // Actualizar en la lista
    const idx = applications.value.findIndex((a) => a.id === selectedApp.value.id);
    if (idx !== -1) {
      applications.value[idx].notes = selectedApp.value.notes;
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error al guardar notas', life: 3000 });
  } finally {
    savingNotes.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/investment-applications');
    applications.value = data;
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las solicitudes', life: 4000 });
    applications.value = [];
  } finally {
    loading.value = false;
  }
});

async function updateStatus(app: any) {
  try {
    await api.put(`/investment-applications/${app.id}/status`, { status: app.status });
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar', life: 3000 });
  }
}
</script>
