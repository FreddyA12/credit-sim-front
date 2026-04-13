<template>
  <form @submit.prevent="submit">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Nombre completo</label>
        <InputText v-model="name" placeholder="Juan Pérez" :class="{ 'p-invalid': errors.name }" />
        <small class="text-red-500">{{ errors.name }}</small>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Correo electrónico</label>
        <InputText v-model="email" type="email" placeholder="correo@ejemplo.com" :class="{ 'p-invalid': errors.email }" />
        <small class="text-red-500">{{ errors.email }}</small>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Contraseña</label>
        <Password v-model="password" toggleMask inputClass="w-full" :class="{ 'p-invalid': errors.password }" />
        <small class="text-red-500">{{ errors.password }}</small>
      </div>
      <Button type="submit" label="Crear cuenta" :loading="loading" class="w-full mt-2" />
      <p class="text-center text-sm text-gray-500">
        ¿Ya tienes cuenta?
        <RouterLink to="/login" class="text-blue-700 font-medium hover:underline">Ingresar</RouterLink>
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useForm, useField } from 'vee-validate';
import * as yup from 'yup';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '../../stores/auth.store';

const schema = yup.object({
  name: yup.string().min(3, 'Mínimo 3 caracteres').required('Requerido'),
  email: yup.string().email('Correo inválido').required('Requerido'),
  password: yup.string().min(8, 'Mínimo 8 caracteres').matches(/[A-Z]/, 'Debe tener mayúscula').matches(/[0-9]/, 'Debe tener número').required('Requerido'),
});
const { errors, handleSubmit } = useForm({ validationSchema: schema });
const { value: name } = useField<string>('name');
const { value: email } = useField<string>('email');
const { value: password } = useField<string>('password');

const loading = ref(false);
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const submit = handleSubmit(async (values) => {
  loading.value = true;
  try {
    await authStore.register(values.name, values.email, values.password);
    router.push('/client');
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo registrar', life: 4000 });
  } finally {
    loading.value = false;
  }
});
</script>
