<template>
  <div>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Dashboard Administrativo</h1>
      <Button label="Actualizar" icon="pi pi-refresh" severity="secondary" size="small" :loading="loading" @click="loadDashboard" />
    </div>

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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card>
        <template #title>Solicitudes de crédito por estado</template>
        <template #content>
          <div v-if="!creditStats" class="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          <div v-else class="h-72">
            <Chart type="doughnut" :data="creditChartData" :options="chartOptions" class="h-full w-full" />
          </div>
        </template>
      </Card>
      <Card>
        <template #title>Solicitudes de inversión por estado</template>
        <template #content>
          <div v-if="!investmentStats" class="h-64 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          <div v-else class="h-72">
            <Chart type="doughnut" :data="investmentChartData" :options="chartOptions" class="h-full w-full" />
          </div>
        </template>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <template #title>Solicitudes de crédito recientes</template>
        <template #content>
          <DataTable :value="creditStats?.recent || []" :rows="5" size="small">
            <Column field="id" header="ID" />
            <Column field="typeName" header="Tipo">
              <template #body="{ data }">{{ data.typeName || '—' }}</template>
            </Column>
            <Column field="status" header="Estado">
              <template #body="{ data }">{{ creditStatusLabel(data.status) }}</template>
            </Column>
            <Column field="amount" header="Monto">
              <template #body="{ data }">${{ fmtMoney(data.amount) }}</template>
            </Column>
          </DataTable>
        </template>
      </Card>
      <Card>
        <template #title>Solicitudes de inversión recientes</template>
        <template #content>
          <DataTable :value="investmentStats?.recent || []" :rows="5" size="small">
            <Column field="id" header="ID" />
            <Column field="productName" header="Producto">
              <template #body="{ data }">{{ data.productName || '—' }}</template>
            </Column>
            <Column field="status" header="Estado">
              <template #body="{ data }">{{ investmentStatusLabel(data.status) }}</template>
            </Column>
            <Column field="amount" header="Monto">
              <template #body="{ data }">${{ fmtMoney(data.amount) }}</template>
            </Column>
          </DataTable>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Chart from 'primevue/chart';
import api from '../../services/api';

const loading = ref(false);
const creditStats = ref<any>(null);
const investmentStats = ref<any>(null);

const stats = ref([
  { label: 'Solicitudes crédito', value: null as any, icon: 'pi pi-file', bg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { label: 'Aprobadas crédito', value: null as any, icon: 'pi pi-check-circle', bg: 'bg-green-100', iconColor: 'text-green-600' },
  { label: 'Solicitudes inversión', value: null as any, icon: 'pi pi-wallet', bg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { label: 'Inversiones activas', value: null as any, icon: 'pi pi-chart-line', bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
]);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, font: { size: 11 } },
    },
  },
};

const creditChartData = computed(() => {
  const c = creditStats.value;
  if (!c) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }
  return {
    labels: ['Pendiente', 'En revisión', 'Aprobadas', 'Rechazadas'],
    datasets: [
      {
        data: [c.pending ?? 0, c.inReview ?? 0, c.approved ?? 0, c.rejected ?? 0],
        backgroundColor: ['#94a3b8', '#f59e0b', '#22c55e', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };
});

const investmentChartData = computed(() => {
  const i = investmentStats.value;
  if (!i) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
  }
  const otros =
    (i.underReview ?? 0) + (i.approved ?? 0) + (i.rejected ?? 0);
  return {
    labels: ['Pendiente', 'Activo', 'Vencido', 'Cancelado', 'Otros estados'],
    datasets: [
      {
        data: [i.pending ?? 0, i.active ?? 0, i.matured ?? 0, i.cancelled ?? 0, otros],
        backgroundColor: ['#94a3b8', '#22c55e', '#3b82f6', '#a855f7', '#cbd5e1'],
        borderWidth: 0,
      },
    ],
  };
});

function fmtMoney(val: unknown): string {
  if (val == null || val === '') return '—';
  const n = Number(val);
  return Number.isFinite(n) ? n.toFixed(2) : '—';
}

const CREDIT_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  under_review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

const INVESTMENT_STATUS: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activo',
  matured: 'Vencido',
  cancelled: 'Cancelado',
  under_review: 'En revisión',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

function creditStatusLabel(s: string) {
  return CREDIT_STATUS[s] ?? s;
}

function investmentStatusLabel(s: string) {
  return INVESTMENT_STATUS[s] ?? s;
}

async function loadDashboard() {
  loading.value = true;
  try {
    const [cRes, iRes] = await Promise.allSettled([
      api.get('/credit-applications/stats'),
      api.get('/investment-applications/stats'),
    ]);
    if (cRes.status === 'fulfilled') {
      creditStats.value = cRes.value.data;
      stats.value[0].value = cRes.value.data.total;
      stats.value[1].value = cRes.value.data.approved;
    } else {
      creditStats.value = null;
    }
    if (iRes.status === 'fulfilled') {
      investmentStats.value = iRes.value.data;
      stats.value[2].value = iRes.value.data.total;
      stats.value[3].value = iRes.value.data.active ?? 0;
    } else {
      investmentStats.value = null;
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDashboard();
});

onActivated(() => {
  loadDashboard();
});
</script>
