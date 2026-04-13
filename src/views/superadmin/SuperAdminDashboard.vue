<template>
  <div>
    <header class="mb-8">
      <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Resumen</p>
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">Panel de administración global</h1>
      <p class="mt-1 text-sm text-slate-600">Vista consolidada de instituciones y cuentas administradoras.</p>
    </header>

    <div class="grid grid-cols-1 gap-4 mb-8 md:grid-cols-2">
      <Card class="overflow-hidden border-slate-200 shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
              <i class="pi pi-building text-xl" />
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Instituciones</p>
              <p class="text-2xl font-bold tabular-nums text-slate-900">{{ institutions.length }}</p>
            </div>
          </div>
        </template>
      </Card>
      <Card class="overflow-hidden border-slate-200 shadow-sm">
        <template #content>
          <div class="flex items-center gap-4">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-200/80 bg-amber-50 text-[#0a1628]"
            >
              <i class="pi pi-users text-xl" />
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Administradores</p>
              <p class="text-2xl font-bold tabular-nums text-slate-900">{{ users.length }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="border-slate-200 shadow-sm">
      <template #title>
        <span class="text-slate-900">Instituciones registradas</span>
      </template>
      <template #content>
        <DataTable :value="institutions" size="small" class="text-sm">
          <Column field="name" header="Nombre" />
          <Column field="slug" header="Slug" />
          <Column field="type" header="Tipo" />
          <Column field="ruc" header="RUC" />
          <Column header="URL pública">
            <template #body="{ data }">
              <a
                :href="`/${data.slug}`"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-[#0a1628] hover:text-[#c9a84c] hover:underline"
              >
                /{{ data.slug }}
              </a>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import api from '../../services/api';

const institutions = ref<any[]>([]);
const users = ref<any[]>([]);

onMounted(async () => {
  const [instRes, usersRes] = await Promise.allSettled([
    api.get('/superadmin/institutions'),
    api.get('/superadmin/users'),
  ]);
  if (instRes.status === 'fulfilled') institutions.value = instRes.value.data;
  if (usersRes.status === 'fulfilled') users.value = usersRes.value.data.filter((u: any) => u.role === 'admin');
});
</script>
