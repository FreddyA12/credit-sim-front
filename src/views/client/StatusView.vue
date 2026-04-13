<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Estado de mis solicitudes</h1>
    <Card class="mb-6">
      <template #content>
        <form @submit.prevent="search" class="flex gap-3 items-end">
          <div class="flex flex-col gap-1 flex-1">
            <label class="text-sm font-medium">Número de cédula</label>
            <InputText v-model="idNumber" placeholder="Ingrese su cédula" maxlength="10" />
          </div>
          <Button type="submit" label="Consultar" icon="pi pi-search" :loading="loading" />
        </form>
      </template>
    </Card>

    <div v-if="result">
      <div class="mb-6">
        <h2 class="text-lg font-semibold text-gray-700 mb-3">Solicitudes de Crédito</h2>
        <div v-if="result.credits.length === 0" class="text-gray-400 text-sm">No hay solicitudes de crédito registradas.</div>
        <div v-else class="flex flex-col gap-3">
          <Card v-for="app in result.credits" :key="app.id" class="cursor-pointer hover:shadow-lg transition" @click="expandedCredit === app.id ? expandedCredit = null : selectCredit(app)">
            <template #content>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-800">{{ app.creditType?.name || 'Crédito' }}</p>
                  <p class="text-sm text-gray-500">Monto: <strong>${{ Number(app.amount).toFixed(2) }}</strong> · {{ app.termMonths }} meses</p>
                  <p class="text-xs text-gray-400">{{ new Date(app.createdAt).toLocaleDateString('es-EC') }}</p>
                </div>
                <div class="flex items-center gap-4">
                  <Tag :value="statusLabel(app.status)" :severity="statusSeverity(app.status)" />
                  <i :class="expandedCredit === app.id ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
                </div>
              </div>

              <!-- Detalles expandidos -->
              <div v-if="expandedCredit === app.id" class="mt-6 pt-6 border-t">
                <!-- Documentos aprobados -->
                <div v-if="app.status === 'approved' && approvedDocuments[app.id]?.length > 0" class="space-y-4">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div class="flex items-center gap-2 text-green-900">
                      <i class="pi pi-check-circle text-xl"></i>
                      <div>
                        <p class="font-medium">Tu crédito ha sido aprobado</p>
                        <p class="text-sm text-green-700">Estos documentos se generaron automáticamente al aprobar tu solicitud</p>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div v-for="doc in approvedDocuments[app.id]" :key="doc.id" class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div class="flex items-center gap-3 flex-1">
                        <i class="pi pi-file-pdf text-2xl text-red-600"></i>
                        <div class="flex-1">
                          <p class="font-medium text-gray-900">{{ doc.documentName }}</p>
                          <p class="text-xs text-gray-500">{{ formatDocumentType(doc.documentType) }} • {{ formatFileSize(doc.fileSize) }}</p>
                          <p v-if="doc.legalNote" class="text-xs text-gray-600 mt-1 italic">{{ doc.legalNote }}</p>
                        </div>
                      </div>
                      <Button icon="pi pi-download" rounded text severity="primary" @click.stop="downloadDocument(doc, app.id)" />
                    </div>
                  </div>
                </div>

                <!-- Sin documentos aprobados -->
                <div v-else-if="app.status === 'approved'" class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p class="text-sm text-blue-900">Los documentos se cargarán pronto. Por favor, intente más tarde.</p>
                </div>

                <!-- Solicitud no aprobada -->
                <div v-else class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p class="text-sm text-yellow-900 font-medium">Estado actual: {{ statusLabel(app.status) }}</p>
                  <p class="text-xs text-yellow-700 mt-1">Los documentos estarán disponibles una vez que tu solicitud sea aprobada</p>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold text-gray-700 mb-3">Solicitudes de Inversión</h2>
        <div v-if="result.investments.length === 0" class="text-gray-400 text-sm">No hay solicitudes de inversión registradas.</div>
        <div v-else class="flex flex-col gap-3">
          <Card v-for="app in result.investments" :key="app.id">
            <template #content>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-800">{{ app.product?.name || 'Inversión' }}</p>
                  <p class="text-sm text-gray-500">Monto: <strong>${{ Number(app.amount).toFixed(2) }}</strong> · {{ app.termDays }} días</p>
                  <p class="text-xs text-gray-400">{{ new Date(app.createdAt).toLocaleDateString('es-EC') }}</p>
                </div>
                <Tag :value="statusLabel(app.status)" :severity="statusSeverity(app.status)" />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import api from '../../services/api';

const route = useRoute();
const slug = computed(() => route.params.slug as string);
const toast = useToast();

const idNumber = ref('');
const loading = ref(false);
const result = ref<{ credits: any[]; investments: any[] } | null>(null);
const expandedCredit = ref<string | null>(null);
const approvedDocuments = ref<Record<string, any[]>>({});

async function search() {
  if (!idNumber.value || idNumber.value.length < 10) {
    return toast.add({ severity: 'warn', summary: 'Ingrese su número de cédula (10 dígitos)', life: 3000 });
  }
  loading.value = true;
  try {
    const { data } = await api.get(`/public/${slug.value}/status/${idNumber.value}`);
    result.value = data;
    if (data.credits.length === 0 && data.investments.length === 0) {
      toast.add({ severity: 'info', summary: 'Sin resultados', detail: 'No se encontraron solicitudes para esa cédula.', life: 4000 });
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo consultar', life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function selectCredit(app: any) {
  expandedCredit.value = app.id;
  
  // Si está aprobada y no tenemos documentos cargados, cargarlos
  if (app.status === 'approved' && !approvedDocuments.value[app.id]) {
    try {
      const { data } = await api.get(`/public/${slug.value}/credit/${app.id}/approved-documents`);
      approvedDocuments.value[app.id] = data;
    } catch (error) {
      console.warn('No se pudieron cargar documentos aprobados:', error);
      approvedDocuments.value[app.id] = [];
    }
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function downloadDocument(doc: any, creditId: string) {
  try {
    const { data } = await api.get(`/public/${slug.value}/credit/${creditId}/approved-documents/${doc.id}/download`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.documentName}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.add({ severity: 'success', summary: 'Documento descargado', life: 2000 });
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error al descargar', detail: error.response?.data?.message, life: 3000 });
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Pendiente',
    under_review: 'En revisión',
    approved: 'Aprobada',
    rejected: 'Rechazada',
    active: 'Activa',
  };
  return map[status] ?? status;
}

function statusSeverity(status: string) {
  const map: Record<string, string> = {
    pending: 'warn',
    under_review: 'info',
    approved: 'success',
    rejected: 'danger',
    active: 'success',
  };
  return map[status] ?? 'secondary';
}
</script>
