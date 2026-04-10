<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Panel de Administración Global</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <template #content>
          <div class="flex items-center gap-4">
            <div class="rounded-full p-3 bg-blue-100">
              <i class="pi pi-building text-2xl text-blue-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Instituciones</p>
              <p class="text-2xl font-bold text-gray-800">{{ institutions.length }}</p>
            </div>
          </div>
        </template>
      </Card>
      <Card>
        <template #content>
          <div class="flex items-center gap-4">
            <div class="rounded-full p-3 bg-green-100">
              <i class="pi pi-users text-2xl text-green-600" />
            </div>
            <div>
              <p class="text-sm text-gray-500">Administradores</p>
              <p class="text-2xl font-bold text-gray-800">{{ users.length }}</p>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card>
      <template #title>Instituciones registradas</template>
      <template #content>
        <DataTable :value="institutions" size="small">
          <Column field="name" header="Nombre" />
          <Column field="slug" header="Slug" />
          <Column field="type" header="Tipo" />
          <Column field="ruc" header="RUC" />
          <Column header="URL pública">
            <template #body="{ data }">
              <a :href="`/${data.slug}`" target="_blank" class="text-blue-600 hover:underline text-sm">
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
