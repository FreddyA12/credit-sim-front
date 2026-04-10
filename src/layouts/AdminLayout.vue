<template>
  <div class="flex min-h-screen bg-gray-100">
    <aside class="w-64 bg-white shadow-md flex flex-col">
      <div class="px-6 py-5 border-b" :style="{ backgroundColor: institution?.primaryColor || '#1A3C6E' }">
        <img v-if="institution?.logoUrl" :src="institution.logoUrl" alt="logo" class="h-10 mb-1" />
        <h2 class="text-white font-bold text-lg truncate">{{ institution?.name || 'Admin' }}</h2>
      </div>
      <nav class="flex-1 py-4">
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
          active-class="bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-700">
          <i :class="link.icon" />
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="px-6 py-4 border-t">
        <p class="text-sm text-gray-600 truncate">{{ user?.name }}</p>
        <Button label="Cerrar sesión" severity="secondary" text size="small" class="mt-1 w-full" @click="logout" />
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import { useAuthStore } from '../stores/auth.store';
import { useInstitutionStore } from '../stores/institution.store';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const router = useRouter();

const navLinks = [
  { to: '/admin/dashboard', icon: 'pi pi-home', label: 'Dashboard' },
  { to: '/admin/institution', icon: 'pi pi-building', label: 'Institución' },
  { to: '/admin/credit-types', icon: 'pi pi-credit-card', label: 'Tipos de Crédito' },
  { to: '/admin/investment-products', icon: 'pi pi-chart-line', label: 'Productos de Inversión' },
  { to: '/admin/credit-applications', icon: 'pi pi-file', label: 'Solicitudes Crédito' },
  { to: '/admin/investment-applications', icon: 'pi pi-wallet', label: 'Solicitudes Inversión' },
];

function logout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => { if (authStore.isAdmin) institutionStore.fetch().catch(() => {}); });
</script>
