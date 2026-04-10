<template>
  <form @submit.prevent="submit">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Correo electrónico</label>
        <InputText v-model="email" type="email" placeholder="correo@ejemplo.com" :class="{ 'p-invalid': errors.email }" />
        <small class="text-red-500">{{ errors.email }}</small>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-gray-700">Contraseña</label>
        <Password v-model="password" :feedback="false" toggleMask :class="{ 'p-invalid': errors.password }" inputClass="w-full" />
        <small class="text-red-500">{{ errors.password }}</small>
      </div>
      <Button type="submit" label="Ingresar" :loading="loading" class="w-full mt-2" />
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

const schema = yup.object({ email: yup.string().email('Correo inválido').required('Requerido'), password: yup.string().required('Requerido') });
const { errors, handleSubmit } = useForm({ validationSchema: schema });
const { value: email } = useField<string>('email');
const { value: password } = useField<string>('password');

const loading = ref(false);
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const submit = handleSubmit(async (values) => {
  loading.value = true;
  try {
    await authStore.login(values.email, values.password);
    router.push(authStore.isSuperAdmin ? '/superadmin' : '/admin');
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Credenciales incorrectas', life: 4000 });
  } finally {
    loading.value = false;
  }
});
</script>
