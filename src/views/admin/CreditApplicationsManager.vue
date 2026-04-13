<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Solicitudes de Crédito</h1>
    <DataTable :value="applications" :loading="loading" stripedRows paginator :rows="10">
      <Column field="id" header="ID" :sortable="true" />
      <Column header="Solicitante">
        <template #body="{ data }">{{ data.clientName }}</template>
      </Column>
      <Column header="Cédula">
        <template #body="{ data }">{{ data.idNumber }}</template>
      </Column>
      <Column header="Tipo de crédito">
        <template #body="{ data }">{{ data.creditType?.name }}</template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">${{ formatNumber(data.amount) }}</template>
      </Column>
      <Column field="termMonths" header="Plazo (meses)" />
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>

      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" severity="info" text rounded @click="openDetail(data)" />
            <Select v-model="data.status" :options="statusOptions" optionLabel="label" optionValue="value" class="text-sm" @change="updateStatus(data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="detailVisible" header="Detalle de Solicitud de Crédito" modal class="w-full max-w-6xl" @hide="resetDetail">
      <div v-if="selected" class="space-y-4">
        <!-- Encabezado con estado -->
        <div class="grid grid-cols-3 gap-4 pb-4 border-b">
          <div>
            <span class="text-sm text-gray-600">Solicitante</span>
            <p class="font-bold text-lg">{{ selected.clientName }}</p>
            <p class="text-sm text-gray-600">{{ selected.idNumber }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Monto solicitado</span>
            <p class="font-bold text-lg">${{ formatNumber(selected.amount) }}</p>
            <p class="text-sm text-gray-600">{{ selected.termMonths }} meses</p>
          </div>
          <div>
            <span class="text-sm text-gray-600">Estado actual</span>
            <Tag :value="statusLabel(selected.status)" :severity="statusSeverity(selected.status)" class="mt-1" />
            <p class="text-xs text-gray-500 mt-2">{{ new Date(selected.createdAt).toLocaleDateString('es-EC') }}</p>
          </div>
        </div>

        <!-- Tabs -->
        <TabView>
          <!-- TAB 1: Información General -->
          <TabPanel header="Información General" value="0">
            <div class="grid grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Nombre</label>
                  <p class="mt-1 text-gray-900">{{ selected.clientName }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Cédula/RUC</label>
                  <p class="mt-1 text-gray-900">{{ selected.idNumber }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Email</label>
                  <p class="mt-1 text-gray-900">{{ selected.clientEmail || 'No proporcionado' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Teléfono</label>
                  <p class="mt-1 text-gray-900">{{ selected.clientPhone || 'No proporcionado' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Patrimonio neto</label>
                  <p class="mt-1 text-gray-900">${{ formatNumber(selected.netWorth || 0) }}</p>
                </div>
              </div>

              <div class="space-y-4">
                <div>
                  <label class="text-sm font-medium text-gray-700">Tipo de crédito</label>
                  <p class="mt-1 text-gray-900">{{ selected.creditType?.name }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Segmento BCE</label>
                  <p class="mt-1 text-gray-900">{{ selected.creditType?.bceSegment || '—' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Tasa aplicada</label>
                  <p class="mt-1 text-gray-900">{{ formatNumber(selected.appliedRate) }}% anual</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Sistema de amortización</label>
                  <p class="mt-1 text-gray-900">{{ selected.amortizationSystem === 'french' ? 'Francés (cuota fija)' : 'Alemán (capital fijo)' }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-gray-700">Tipo de solicitante</label>
                  <p class="mt-1 text-gray-900">{{ selected.applicantType || 'Natural' }}</p>
                </div>
              </div>
            </div>
          </TabPanel>

          <!-- TAB 2: Capacidad de Pago -->
          <TabPanel header="Capacidad de Pago" value="1">
            <div class="grid grid-cols-3 gap-6 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600">Ingresos mensuales</p>
                <p class="text-2xl font-bold text-blue-900">${{ formatNumber(selected.monthlyIncome || 0) }}</p>
              </div>
              <div class="bg-yellow-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600">Gastos mensuales</p>
                <p class="text-2xl font-bold text-yellow-900">${{ formatNumber(selected.monthlyExpenses || 0) }}</p>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg">
                <p class="text-sm text-gray-600">Otras deudas</p>
                <p class="text-2xl font-bold text-orange-900">${{ formatNumber(selected.otherDebts || 0) }}</p>
              </div>
            </div>

            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
              <p class="text-sm font-medium text-gray-700">Capacidad máxima de pago (40% ingresos netos)</p>
              <p class="text-3xl font-bold text-green-900 mt-2">${{ formatNumber(selected.maxPaymentCalc || 0) }}</p>
              <p class="text-xs text-gray-600 mt-2">
                Base: ({{ formatNumber(selected.monthlyIncome || 0) }} - {{ formatNumber(selected.monthlyExpenses || 0) }} - {{ formatNumber(selected.otherDebts || 0) }}) × 40%
              </p>
            </div>
          </TabPanel>

          <!-- TAB 3: Amortización -->
          <TabPanel header="Tabla de Amortización" value="2">
            <div v-if="selected.scheduleJson && selected.scheduleJson.length > 0" class="overflow-x-auto">
              <DataTable :value="selected.scheduleJson" :rows="10" paginator stripedRows size="small">
                <Column field="number" header="Cuota" :sortable="true" />
                <Column field="paymentDate" header="Fecha">
                  <template #body="{ data }">
                    {{ new Date(data.paymentDate).toLocaleDateString('es-EC') }}
                  </template>
                </Column>
                <Column field="principal" header="Capital">
                  <template #body="{ data }">
                    ${{ formatNumber(data.principal) }}
                  </template>
                </Column>
                <Column field="interest" header="Interés">
                  <template #body="{ data }">
                    ${{ formatNumber(data.interest) }}
                  </template>
                </Column>
                <Column field="totalPayment" header="Cuota Total">
                  <template #body="{ data }">
                    <strong>${{ formatNumber(data.totalPayment) }}</strong>
                  </template>
                </Column>
                <Column field="balance" header="Saldo">
                  <template #body="{ data }">
                    ${{ formatNumber(data.balance) }}
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              No hay información de amortización disponible
            </div>
          </TabPanel>

          <!-- TAB 4: Documentos -->
          <TabPanel header="Documentos" value="3">
            <div v-if="selected.documents && selected.documents.length > 0" class="grid grid-cols-1 gap-3">
              <div v-for="doc in selected.documents" :key="doc.id" class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div class="flex items-center gap-3">
                  <i class="pi pi-file text-2xl text-blue-600"></i>
                  <div>
                    <p class="font-medium">{{ doc.documentType }}</p>
                    <p class="text-xs text-gray-500">{{ doc.originalName }} • {{ formatFileSize(doc.sizeBytes) }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button icon="pi pi-download" severity="secondary" text rounded @click="downloadDocument(doc)" title="Descargar" />
                  <Button icon="pi pi-eye" severity="info" text rounded @click="openDocumentPreview(doc)" title="Ver" />
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500">
              No hay documentos adjuntos
            </div>
          </TabPanel>

          <!-- TAB 5: Buró de Crédito -->
          <TabPanel header="Buró de Crédito" value="4">
            <CreditBureauCheck />
          </TabPanel>

          <!-- TAB 6: Decisión -->
          <TabPanel header="Decisión y Notas" value="5">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-700">Decisión</label>
                <Select 
                  v-model="decisionForm.status" 
                  :options="decisionStatusOptions" 
                  optionLabel="label" 
                  optionValue="value"
                  class="w-full mt-2"
                />
              </div>

              <div v-if="decisionForm.status === 'rejected'" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                <i class="pi pi-exclamation-triangle mr-2"></i>
                Se notificará al solicitante sobre el rechazo con los motivos indicados.
              </div>

              <div>
                <label class="text-sm font-medium text-gray-700">Notas de la revisión</label>
                <Textarea 
                  v-model="decisionForm.notes" 
                  rows="5"
                  placeholder="Ingrese los detalles de su decisión, observaciones del análisis, etc."
                  class="w-full mt-2"
                />
              </div>

              <div v-if="selected.notes" class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p class="text-sm font-medium text-blue-900">Notas anteriores</p>
                <p class="text-sm text-blue-800 mt-1">{{ selected.notes }}</p>
              </div>

              <div class="flex gap-2 justify-end pt-4">
                <Button label="Cancelar" severity="secondary" @click="detailVisible = false" />
                <Button 
                  label="Guardar decisión" 
                  @click="saveDecision" 
                  :loading="savingDecision"
                  :disabled="!decisionForm.status"
                />
              </div>
            </div>
          </TabPanel>

          <!-- TAB 7: Documentos Aprobados -->
          <TabPanel header="Documentos Aprobados" value="6">
            <div v-if="approvedDocuments.length > 0" class="space-y-3">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div class="flex items-center gap-2 text-green-900">
                  <i class="pi pi-check-circle text-xl"></i>
                  <div>
                    <p class="font-medium">Documentos generados automáticamente</p>
                    <p class="text-sm text-green-700">Se generaron {{ approvedDocuments.length }} documentos al aprobar este crédito</p>
                  </div>
                </div>
              </div>

              <div v-for="doc in approvedDocuments" :key="doc.id" class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition">
                <div class="flex items-center gap-4 flex-1">
                  <i class="pi pi-file-pdf text-3xl text-red-600"></i>
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">{{ doc.documentName }}</p>
                    <p class="text-xs text-gray-500 mt-1">
                      <span class="bg-gray-100 px-2 py-1 rounded mr-2">{{ formatDocumentType(doc.documentType) }}</span>
                      <span>{{ formatFileSize(doc.fileSize) }} • {{ new Date(doc.createdAt).toLocaleDateString('es-EC') }}</span>
                    </p>
                    <p v-if="doc.legalNote" class="text-xs text-gray-600 mt-2 italic">{{ doc.legalNote }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <Button icon="pi pi-download" severity="primary" text rounded @click="downloadApprovedDocument(doc)" title="Descargar" />
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8">
              <i class="pi pi-inbox text-4xl text-gray-300 mb-4 block"></i>
              <p class="text-gray-500">No hay documentos aprobados</p>
              <p class="text-sm text-gray-400 mt-1">Los documentos se generarán automáticamente al aprobar el crédito</p>
            </div>
          </TabPanel>
        </TabView>
      </div>
    </Dialog>

    <!-- Dialog para preview de documentos -->
    <Dialog v-model:visible="docPreviewVisible" header="Vista previa de documento" modal class="w-full max-w-4xl">
      <div v-if="previewDoc" class="flex flex-col items-center justify-center">
        <p class="mb-4 text-gray-600">{{ previewDoc.originalName }}</p>
        <iframe v-if="isPdfFile(previewDoc.mimeType)" :src="previewDoc.fileUrl" class="w-full h-96" />
        <img v-else-if="isImageFile(previewDoc.mimeType)" :src="previewDoc.fileUrl" class="max-h-96 max-w-full" />
        <div v-else class="text-center py-8 text-gray-500">
          <i class="pi pi-file text-6xl mb-4"></i>
          <p>No se puede previsualizarse este tipo de archivo</p>
          <Button label="Descargar" icon="pi pi-download" @click="downloadDocument(previewDoc)" class="mt-4" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Textarea from 'primevue/textarea';
import ProgressBar from 'primevue/progressbar';
import { formatNumber } from '../../utils/number-utils';
import api from '../../services/api';
import CreditBureauCheck from '../../components/CreditBureauCheck.vue';

const toast = useToast();
const applications = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const docPreviewVisible = ref(false);
const selected = ref<any>(null);
const previewDoc = ref<any>(null);
const savingDecision = ref(false);
const approvedDocuments = ref<any[]>([]);

const decisionForm = ref({ status: '', notes: '' });

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'En revisión', value: 'under_review' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Rechazado', value: 'rejected' },
];

const decisionStatusOptions = [
  { label: 'En revisión', value: 'under_review' },
  { label: 'Aprobado', value: 'approved' },
  { label: 'Rechazado', value: 'rejected' },
];

function statusLabel(s: string) {
  return statusOptions.find((o) => o.value === s)?.label ?? s;
}

function statusSeverity(s: string) {
  const map: Record<string, string> = { pending: 'warn', under_review: 'info', approved: 'success', rejected: 'danger' };
  return map[s] ?? 'secondary';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function isPdfFile(mimeType: string): boolean {
  return mimeType.includes('pdf');
}

function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function downloadDocument(doc: any) {
  const link = document.createElement('a');
  link.href = doc.fileUrl;
  link.download = doc.originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function openDocumentPreview(doc: any) {
  previewDoc.value = doc;
  docPreviewVisible.value = true;
}

function resetDetail() {
  selected.value = null;
  decisionForm.value = { status: '', notes: '' };
  approvedDocuments.value = [];
}

async function saveDecision() {
  if (!selected.value || !decisionForm.value.status) {
    toast.add({ severity: 'warn', summary: 'Seleccione una decisión', life: 2000 });
    return;
  }

  savingDecision.value = true;
  try {
    await api.put(`/credit-applications/${selected.value.id}/status`, {
      status: decisionForm.value.status,
      notes: decisionForm.value.notes,
    });

    // Actualizar en la lista
    const idx = applications.value.findIndex((a) => a.id === selected.value.id);
    if (idx !== -1) {
      applications.value[idx].status = decisionForm.value.status;
      applications.value[idx].notes = decisionForm.value.notes;
    }

    toast.add({ severity: 'success', summary: 'Decisión guardada', life: 2000 });
    detailVisible.value = false;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al guardar', detail: error.response?.data?.message, life: 3000 });
  } finally {
    savingDecision.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get('/credit-applications');
    applications.value = data;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al cargar solicitudes', life: 3000 });
  } finally {
    loading.value = false;
  }
});

async function openDetail(data: any) {
  try {
    // Cargar detalles completos incluyendo documentos
    const { data: fullDetails } = await api.get(`/credit-applications/${data.id}`);
    selected.value = fullDetails;
    decisionForm.value = { status: fullDetails.status || '', notes: fullDetails.notes || '' };
    
    // Cargar documentos aprobados si el crédito está aprobado
    if (fullDetails.status === 'approved') {
      try {
        const { data: docs } = await api.get(`/credit-applications/${data.id}/approved-documents`);
        approvedDocuments.value = docs;
      } catch (error) {
        console.warn('No se pudieron cargar documentos aprobados');
        approvedDocuments.value = [];
      }
    } else {
      approvedDocuments.value = [];
    }
    
    detailVisible.value = true;
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al cargar detalles', detail: error.response?.data?.message, life: 3000 });
  }
}

async function updateStatus(app: any) {
  try {
    await api.put(`/credit-applications/${app.id}/status`, { status: app.status });
    toast.add({ severity: 'success', summary: 'Estado actualizado', life: 2000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error al actualizar estado', life: 3000 });
  }
}

function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'carta_aprobacion': 'Carta de Aprobación',
    'contrato_credito': 'Contrato de Crédito',
    'tabla_amortizacion': 'Tabla de Amortización',
    'comprobante_desembolso': 'Comprobante de Desembolso',
    'certificado_no_adeudar': 'Certificado de No Adeudo',
  };
  return typeMap[type] || type;
}

async function downloadApprovedDocument(doc: any) {
  try {
    const response = await api.get(`/credit-applications/approved-documents/${doc.id}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.documentName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.add({ severity: 'success', summary: 'Documento descargado', life: 2000 });
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al descargar documento', detail: error.response?.data?.message, life: 3000 });
  }
}
</script>
