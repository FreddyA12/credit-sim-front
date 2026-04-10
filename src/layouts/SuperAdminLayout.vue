<template>
  <div class="flex min-h-screen bg-gray-100">
    <aside class="w-64 bg-gray-900 flex flex-col">
      <div class="px-6 py-5 border-b border-gray-700">
        <h2 class="text-white font-bold text-lg">Panel SuperAdmin</h2>
        <p class="text-gray-400 text-xs mt-1">Simulador Financiero</p>
      </div>
      <nav class="flex-1 py-4">
        <RouterLink v-for="link in navLinks" :key="link.to" :to="link.to"
          class="flex items-center gap-3 px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          active-class="bg-gray-800 text-white border-r-4 border-blue-400">
          <i :class="link.icon" />
          {{ link.label }}
        </RouterLink>
      </nav>
      <div class="px-6 py-4 border-t border-gray-700">
        <p class="text-sm text-gray-400 truncate">{{ user?.name }}</p>
        <Button label="Cerrar sesión" severity="secondary" text size="small" class="mt-1 w-full text-gray-300" @click="logout" />
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto p-6">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const navLinks = [
  { to: '/superadmin/dashboard', icon: 'pi pi-home', label: 'Dashboard' },
  { to: '/superadmin/institutions', icon: 'pi pi-building', label: 'Instituciones' },
];

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>
