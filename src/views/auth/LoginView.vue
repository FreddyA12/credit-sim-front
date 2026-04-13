<template>
  <form @submit.prevent="submit" class="login-form">

    <!-- Email -->
    <div class="field">
      <label class="field-label">Correo electrónico</label>
      <InputText
        v-model="email"
        type="email"
        placeholder="correo@institución.com"
        :class="['lf-input', { 'p-invalid': errors.email }]"
      />
      <small v-if="errors.email" class="field-error">{{ errors.email }}</small>
    </div>

    <!-- Contraseña -->
    <div class="field">
      <div class="field-header">
        <label class="field-label">Contraseña</label>
        <a href="#" class="forgot-link">¿Olvidaste tu contraseña?</a>
      </div>
      <Password
        v-model="password"
        :feedback="false"
        toggleMask
        :class="['lf-password', { 'p-invalid': errors.password }]"
        inputClass="lf-input"
      />
      <small v-if="errors.password" class="field-error">{{ errors.password }}</small>
    </div>

    <!-- Botón -->
    <Button
      type="submit"
      :loading="loading"
      label="Ingresar"
      icon="pi pi-arrow-right"
      iconPos="right"
      class="lf-btn"
    />

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
  email: yup.string().email('Correo inválido').required('Requerido'),
  password: yup.string().required('Requerido'),
});
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
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.message || 'Credenciales incorrectas',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  font-family: 'Poppins', sans-serif;
  width: 100%;
}

/* Campo */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.field-label {
  font-size: 0.775rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.01em;
}
.forgot-link {
  font-size: 0.72rem;
  font-weight: 600;
  color: #c9a84c;
  text-decoration: none;
  transition: color 0.15s;
}
.forgot-link:hover { color: #a8883a; }

/* Inputs */
:deep(.lf-input),
:deep(.lf-input.p-inputtext) {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.65rem 0.9rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  color: #0f172a;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  box-shadow: none;
}
:deep(.lf-input:focus),
:deep(.lf-input.p-inputtext:focus) {
  border-color: #c9a84c;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
  outline: none;
}
:deep(.lf-input.p-invalid) {
  border-color: #f87171;
}

/* Password */
:deep(.lf-password),
:deep(.lf-password .p-password) {
  width: 100%;
}
:deep(.lf-password .p-password-input) {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.65rem 0.9rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  color: #0f172a;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
:deep(.lf-password .p-password-input:focus) {
  border-color: #c9a84c;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
  outline: none;
}
:deep(.lf-password.p-invalid .p-password-input) {
  border-color: #f87171;
}

.field-error {
  font-size: 0.7rem;
  color: #ef4444;
  font-weight: 500;
}

/* Botón gold */
:deep(.lf-btn.p-button) {
  width: 100%;
  background: #c9a84c;
  border: none;
  border-radius: 0.6rem;
  padding: 0.72rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: #0a1628;
  letter-spacing: 0.03em;
  justify-content: center;
  margin-top: 0.5rem;
  transition: background 0.15s, box-shadow 0.15s, transform 0.1s;
  box-shadow:
    0 1px 2px rgba(201,168,76,0.2),
    0 4px 16px rgba(201,168,76,0.25);
}
:deep(.lf-btn.p-button:hover:not(:disabled)) {
  background: #b8943e;
  box-shadow:
    0 2px 4px rgba(201,168,76,0.2),
    0 8px 24px rgba(201,168,76,0.3);
  transform: translateY(-1px);
}
:deep(.lf-btn.p-button:active) {
  transform: translateY(0);
  background: #c9a84c;
}
:deep(.lf-btn.p-button:focus) {
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.3);
}
</style>
