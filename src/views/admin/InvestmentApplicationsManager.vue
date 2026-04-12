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
        <template #body="{ data }">{{ data.product?.name }}</template>
      </Column>
      <Column header="Monto">
        <template #body="{ data }">${{ Number(data.amount).toFixed(2) }}</template>
      </Column>
      <Column field="termDays" header="Plazo (días)" />
      <Column header="Interés bruto">
        <template #body="{ data }">${{ data.grossInterest?.toFixed(2) }}</template>
      </Column>
      <Column header="Retención IR">
        <template #body="{ data }">${{ data.irWithholding?.toFixed(2) }}</template>
      </Column>
      <Column header="Interés neto">
        <template #body="{ data }">${{ data.netInterest?.toFixed(2) }}</template>
      </Column>
      <Column header="Estado">
        <template #body="{ data }">
          <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
        </template>
      </Column>
      <Column header="Estado">
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
    <Dialog v-model:visible="detailVisible" modal header="Detalle de Solicitud de Inversión" :style="{ width: '90vw', maxWidth: '1200px' }" :closable="true">
      <Tabs value="0" v-if="selectedApp">
        <TabList>
          <Tab value="0">Información General</Tab>
          <Tab value="1">Proyección Financiera</Tab>
          <Tab value="2">Validaciones y Documentos</Tab>
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
                  <div><span class="font-medium">Monto:</span> ${{ Number(selectedApp.amount).toFixed(2) }}</div>
                  <div><span class="font-medium">Plazo:</span> {{ selectedApp.termDays }} días</div>
                  <div><span class="font-medium">Tasa aplicada:</span> {{ selectedApp.appliedRate }}%</div>
                  <div><span class="font-medium">Frecuencia de pago:</span> {{ paymentFrequencyLabel(selectedApp.paymentFrequency) }}</div>
                </div>
              </div>

              <div class="bg-green-50 p-4 rounded md:col-span-2">
                <h3 class="font-bold text-gray-700 mb-3">Cálculos Financieros</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><span class="font-medium">Interés bruto:</span> ${{ selectedApp.grossInterest?.toFixed(2) }}</div>
                  <div><span class="font-medium">Retención IR:</span> ${{ selectedApp.irWithholding?.toFixed(2) }}</div>
                  <div><span class="font-medium">Interés neto:</span> ${{ selectedApp.netInterest?.toFixed(2) }}</div>
                  <div><span class="font-medium">Al vencimiento:</span> <strong class="text-green-700">${{ selectedApp.amountAtMaturity?.toFixed(2) }}</strong></div>
                </div>
              </div>

              <div class="bg-blue-50 p-4 rounded md:col-span-2">
                <h3 class="font-bold text-gray-700 mb-3">Información Adicional</h3>
                <div class="space-y-2">
                  <div><span class="font-medium">Fecha de solicitud:</span> {{ new Date(selectedApp.createdAt).toLocaleString('es-EC') }}</div>
                  <div v-if="selectedApp.contractSignedAt"><span class="font-medium">Firmado el:</span> {{ new Date(selectedApp.contractSignedAt).toLocaleString('es-EC') }}</div>
                  <div v-if="selectedApp.contractSignIp"><span class="font-medium">IP de firma:</span> {{ selectedApp.contractSignIp }}</div>
                  <div v-if="selectedApp.fundsOrigin"><span class="font-medium">Origen de fondos:</span> {{ selectedApp.fundsOrigin }}</div>
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
                    <span v-if="data.totalAtMaturity" class="font-bold text-green-600">
                      ${{ data.totalAtMaturity?.toFixed(2) }}
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

          <!-- Tab 3: Validaciones y Documentos -->
          <TabPanel value="2">
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-gray-50 p-4 rounded text-center">
                  <i :class="selectedApp.biometricsValidated ? 'pi pi-check-circle text-green-600' : 'pi pi-times-circle text-red-600'" class="text-3xl mb-2"></i>
                  <div class="text-sm font-medium">Biometría</div>
                  <div class="text-xs text-gray-600">{{ selectedApp.biometricsValidated ? 'Validada' : 'No validada' }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded text-center">
                  <i :class="selectedApp.pepDeclared ? 'pi pi-exclamation-triangle text-yellow-600' : 'pi pi-check text-gray-400'" class="text-3xl mb-2"></i>
                  <div class="text-sm font-medium">PEP</div>
                  <div class="text-xs text-gray-600">{{ selectedApp.pepDeclared ? 'Persona expuesta políticamente' : 'No aplica' }}</div>
                </div>
                <div class="bg-gray-50 p-4 rounded text-center">
                  <i class="pi pi-file text-gray-600 text-3xl mb-2"></i>
                  <div class="text-sm font-medium">Documentos</div>
                  <div class="text-xs text-gray-600">No implementado aún</div>
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

const toast = useToast();
const applications = ref<any[]>([]);
const loading = ref(false);
const detailVisible = ref(false);
const selectedApp = ref<any>(null);
const savingNotes = ref(false);

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Activo', value: 'active' },
  { label: 'Vencido', value: 'matured' },
  { label: 'Cancelado', value: 'cancelled' },
];

function statusLabel(s: string) { return statusOptions.find((o) => o.value === s)?.label ?? s; }
function statusSeverity(s: string) {
  const map: Record<string, string> = { pending: 'warn', active: 'success', matured: 'info', cancelled: 'danger' };
  return map[s] ?? 'secondary';
}

function viewDetail(app: any) {
  selectedApp.value = { ...app };
  detailVisible.value = true;
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
  const { data } = await api.get('/investment-applications');
  applications.value = data;
  loading.value = false;
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
