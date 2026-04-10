<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-800 mb-6">Configuración de la Institución</h1>
    <Card>
      <template #content>
        <form @submit.prevent="save" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Nombre</label>
            <InputText v-model="form.name" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Tipo</label>
            <Select v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">RUC</label>
            <InputText v-model="form.ruc" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Teléfono</label>
            <InputText v-model="form.phone" />
          </div>
          <div class="flex flex-col gap-1 md:col-span-2">
            <label class="text-sm font-medium">Dirección</label>
            <InputText v-model="form.address" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Correo institucional</label>
            <InputText v-model="form.email" type="email" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Slogan</label>
            <InputText v-model="form.slogan" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Color primario</label>
            <div class="flex gap-2 items-center">
              <input type="color" v-model="form.primaryColor" class="h-10 w-14 cursor-pointer rounded" />
              <InputText v-model="form.primaryColor" class="flex-1" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">Color secundario</label>
            <div class="flex gap-2 items-center">
              <input type="color" v-model="form.secondaryColor" class="h-10 w-14 cursor-pointer rounded" />
              <InputText v-model="form.secondaryColor" class="flex-1" />
            </div>
          </div>
          <div class="md:col-span-2 flex flex-col gap-2">
            <label class="text-sm font-medium">Logo</label>
            <div class="flex items-center gap-4">
              <img v-if="institution?.logoUrl" :src="institution.logoUrl" alt="logo" class="h-16 rounded" />
              <FileUpload mode="basic" accept="image/*" :maxFileSize="2000000" chooseLabel="Subir logo"
                @select="onLogoSelect" :auto="false" />
            </div>
          </div>
          <div class="md:col-span-2 flex justify-end">
            <Button type="submit" label="Guardar cambios" icon="pi pi-save" :loading="saving" />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import { useInstitutionStore } from '../../stores/institution.store';

const toast = useToast();
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const saving = ref(false);

const typeOptions = [
  { label: 'Banco', value: 'banco' },
  { label: 'Cooperativa', value: 'cooperativa' },
  { label: 'Mutualista', value: 'mutualista' },
];

const form = ref({ name: '', type: '', ruc: '', address: '', phone: '', email: '', slogan: '', primaryColor: '#1A3C6E', secondaryColor: '#F5A623' });

watch(institution, (val) => {
  if (val) Object.assign(form.value, val);
}, { immediate: true });

onMounted(() => institutionStore.fetch());

async function save() {
  saving.value = true;
  try {
    await institutionStore.update(form.value);
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Institución actualizada', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar', life: 3000 });
  } finally {
    saving.value = false;
  }
}

async function onLogoSelect(event: any) {
  const file = event.files[0];
  if (!file) return;
  try {
    await institutionStore.uploadLogo(file);
    toast.add({ severity: 'success', summary: 'Logo actualizado', life: 3000 });
  } catch {
    toast.add({ severity: 'error', summary: 'Error al subir logo', life: 3000 });
  }
}
</script>
