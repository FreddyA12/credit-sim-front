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
          <Card v-for="app in result.credits" :key="app.id">
            <template #content>
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-semibold text-gray-800">{{ app.creditType?.name || 'Crédito' }}</p>
                  <p class="text-sm text-gray-500">Monto: <strong>${{ Number(app.amount).toFixed(2) }}</strong> · {{ app.termMonths }} meses</p>
                  <p class="text-xs text-gray-400">{{ new Date(app.createdAt).toLocaleDateString('es-EC') }}</p>
                </div>
                <Tag :value="statusLabel(app.status)" :severity="statusSeverity(app.status)" />
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
