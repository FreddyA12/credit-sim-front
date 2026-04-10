<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard Administrativo</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card v-for="stat in stats" :key="stat.label">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="rounded-full p-3" :class="stat.bg">
              <i :class="[stat.icon, 'text-2xl', stat.iconColor]" />
            </div>
            <div>
              <p class="text-sm text-gray-500">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-gray-800">{{ stat.value ?? '—' }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <template #title>Solicitudes de Crédito Recientes</template>
        <template #content>
          <DataTable :value="creditStats?.recent || []" :rows="5" size="small">
            <Column field="id" header="ID" />
            <Column field="status" header="Estado" />
            <Column field="requestedAmount" header="Monto" />
          </DataTable>
        </template>
      </Card>
      <Card>
        <template #title>Solicitudes de Inversión Recientes</template>
        <template #content>
          <DataTable :value="investmentStats?.recent || []" :rows="5" size="small">
            <Column field="id" header="ID" />
            <Column field="status" header="Estado" />
            <Column field="amount" header="Monto" />
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import api from '../../services/api';

const creditStats = ref<any>(null);
const investmentStats = ref<any>(null);

const stats = ref([
  { label: 'Solicitudes Crédito', value: null as any, icon: 'pi pi-file', bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Aprobadas Crédito', value: null as any, icon: 'pi pi-check-circle', bg: 'bg-green-100', iconColor: 'text-green-600' },
  { label: 'Solicitudes Inversión', value: null as any, icon: 'pi pi-wallet', bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { label: 'Inversiones Activas', value: null as any, icon: 'pi pi-chart-line', bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
]);

onMounted(async () => {
  const [cRes, iRes] = await Promise.allSettled([
    api.get('/credit-applications/stats'),
    api.get('/investment-applications/stats'),
  ]);
  if (cRes.status === 'fulfilled') {
    creditStats.value = cRes.value.data;
    stats.value[0].value = cRes.value.data.total;
    stats.value[1].value = cRes.value.data.approved;
  }
  if (iRes.status === 'fulfilled') {
    investmentStats.value = iRes.value.data;
    stats.value[2].value = iRes.value.data.total;
    stats.value[3].value = iRes.value.data.active;
  }
});
</script>
