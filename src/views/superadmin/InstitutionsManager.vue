<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Gestión de Instituciones</h1>
      <Button label="Nueva institución" icon="pi pi-plus" @click="openCreate" />
    </div>

    <DataTable :value="institutions" size="small" class="mb-6">
      <Column field="name" header="Nombre" />
      <Column field="slug" header="Slug" />
      <Column field="type" header="Tipo" />
      <Column field="ruc" header="RUC" />
      <Column header="Acciones">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-user-plus" size="small" text severity="info" title="Crear admin" @click="openCreateAdmin(data)" />
            <Button icon="pi pi-trash" size="small" text severity="danger" @click="deleteInstitution(data.id)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="showCreateDialog" header="Nueva Institución" :style="{ width: '500px' }" modal>
      <form @submit.prevent="saveInstitution" class="flex flex-col gap-3 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Slug (URL) *</label>
            <InputText v-model="instForm.slug" placeholder="banco-ejemplo" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Nombre *</label>
            <InputText v-model="instForm.name" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Tipo</label>
            <Select v-model="instForm.type" :options="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">RUC</label>
            <InputText v-model="instForm.ruc" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Teléfono</label>
            <InputText v-model="instForm.phone" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Email</label>
            <InputText v-model="instForm.email" type="email" />
          </div>
          <div class="flex flex-col gap-1 col-span-2">
            <label class="text-sm font-medium">Dirección</label>
            <InputText v-model="instForm.address" />
          </div>
          <div class="flex flex-col gap-1 col-span-2">
            <label class="text-sm font-medium">Slogan</label>
            <InputText v-model="instForm.slogan" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Color primario</label>
            <div class="flex gap-2 items-center">
              <input type="color" v-model="instForm.primaryColor" class="h-9 w-12 cursor-pointer rounded" />
              <InputText v-model="instForm.primaryColor" class="flex-1" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Color secundario</label>
            <div class="flex gap-2 items-center">
              <input type="color" v-model="instForm.secondaryColor" class="h-9 w-12 cursor-pointer rounded" />
              <InputText v-model="instForm.secondaryColor" class="flex-1" />
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" severity="secondary" @click="showCreateDialog = false" />
          <Button type="submit" label="Crear institución" icon="pi pi-check" :loading="saving" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showAdminDialog" :header="`Crear admin para: ${selectedInstitution?.name}`" :style="{ width: '400px' }" modal>
      <form @submit.prevent="saveAdmin" class="flex flex-col gap-3 pt-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Nombre *</label>
          <InputText v-model="adminForm.name" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Email *</label>
          <InputText v-model="adminForm.email" type="email" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Contraseña *</label>
          <Password v-model="adminForm.password" :feedback="false" toggleMask inputClass="w-full" />
        </div>
        <div class="flex justify-end gap-2 mt-2">
          <Button label="Cancelar" severity="secondary" @click="showAdminDialog = false" />
          <Button type="submit" label="Crear admin" icon="pi pi-check" :loading="savingAdmin" />
        </div>
      </form>
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
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Password from 'primevue/password';
import api from '../../services/api';

const toast = useToast();
const institutions = ref<any[]>([]);
const saving = ref(false);
const savingAdmin = ref(false);
const showCreateDialog = ref(false);
const showAdminDialog = ref(false);
const selectedInstitution = ref<any>(null);

const typeOptions = [
  { label: 'Banco privado', value: 'private_bank' },
  { label: 'Cooperativa', value: 'cooperative' },
  { label: 'Mutualista', value: 'mutualista' },
  { label: 'Banco público', value: 'public_bank' },
];

const instForm = ref({ slug: '', name: '', type: 'cooperative', ruc: '', address: '', phone: '', email: '', slogan: '', primaryColor: '#1A3C6E', secondaryColor: '#F5A623' });
const adminForm = ref({ name: '', email: '', password: '' });

async function loadInstitutions() {
  const { data } = await api.get('/superadmin/institutions');
  institutions.value = data;
}

onMounted(loadInstitutions);

function openCreate() {
  instForm.value = { slug: '', name: '', type: 'cooperative', ruc: '', address: '', phone: '', email: '', slogan: '', primaryColor: '#1A3C6E', secondaryColor: '#F5A623' };
  showCreateDialog.value = true;
}

function openCreateAdmin(institution: any) {
  selectedInstitution.value = institution;
  adminForm.value = { name: '', email: '', password: '' };
  showAdminDialog.value = true;
}

async function saveInstitution() {
  if (!instForm.value.slug || !instForm.value.name) {
    return toast.add({ severity: 'warn', summary: 'Slug y nombre son requeridos', life: 3000 });
  }
  saving.value = true;
  try {
    await api.post('/superadmin/institutions', instForm.value);
    await loadInstitutions();
    showCreateDialog.value = false;
    toast.add({ severity: 'success', summary: 'Institución creada', life: 3000 });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo crear', life: 4000 });
  } finally {
    saving.value = false;
  }
}

async function saveAdmin() {
  if (!adminForm.value.name || !adminForm.value.email || !adminForm.value.password) {
    return toast.add({ severity: 'warn', summary: 'Todos los campos son requeridos', life: 3000 });
  }
  savingAdmin.value = true;
  try {
    await api.post(`/superadmin/institutions/${selectedInstitution.value.id}/admins`, adminForm.value);
    showAdminDialog.value = false;
    toast.add({ severity: 'success', summary: 'Administrador creado', life: 3000 });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo crear', life: 4000 });
  } finally {
    savingAdmin.value = false;
  }
}

async function deleteInstitution(id: string) {
  if (!confirm('¿Está seguro de eliminar esta institución?')) return;
  try {
    await api.delete(`/superadmin/institutions/${id}`);
    await loadInstitutions();
    toast.add({ severity: 'success', summary: 'Institución eliminada', life: 3000 });
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo eliminar', life: 4000 });
  }
}
</script>
