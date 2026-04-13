<template>
  <div class="sa-shell">
    <aside class="sa-sidebar" aria-label="Navegación principal">
      <div class="sa-sidebar-bg" aria-hidden="true" />

      <div class="sa-sidebar-top">
        <div class="sa-brand">
          <div class="sa-brand-mark">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 1L1 6.5v7L10 19l9-5.5v-7L10 1z" fill="#c9a84c" />
              <path d="M10 1L1 6.5L10 12l9-5.5L10 1z" fill="#e8c96a" opacity="0.7" />
            </svg>
          </div>
          <div class="sa-brand-text">
            <span class="sa-brand-name">FinSim</span>
            <span class="sa-brand-tag">SuperAdmin</span>
          </div>
        </div>
        <p class="sa-menu-label">Menú</p>
        <nav class="sa-nav">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="sa-nav-link"
            active-class="sa-nav-link--active"
          >
            <i :class="link.icon" class="sa-nav-icon" />
            {{ link.label }}
          </RouterLink>
        </nav>
      </div>

      <div class="sa-sidebar-bottom">
        <p class="sa-user">{{ user?.name }}</p>
        <button type="button" class="sa-logout" @click="logout">
          <i class="pi pi-sign-out" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="sa-main">
      <div class="sa-main-inner">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SuperAdminLayout' });
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth.store';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const navLinks = [
  { to: '/superadmin/dashboard', icon: 'pi pi-home', label: 'Dashboard' },
  { to: '/superadmin/institutions', icon: 'pi pi-building', label: 'Instituciones' },
  { to: '/superadmin/jprf-rates', icon: 'pi pi-percentage', label: 'Tasas JPRF' },
  { to: '/superadmin/bce-rate-limits', icon: 'pi pi-percentage', label: 'Límites BCE' },
];

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.sa-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'Poppins', system-ui, sans-serif;
}

.sa-sidebar {
  position: relative;
  width: 16rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #0a1628;
  color: #e2e8f0;
}

.sa-sidebar-bg {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(201, 168, 76, 0.14) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
}

.sa-sidebar-top {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem 1rem;
}

.sa-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0 0.5rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sa-brand-mark {
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.65rem;
  background: rgba(201, 168, 76, 0.12);
  border: 1px solid rgba(201, 168, 76, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sa-brand-text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.sa-brand-name {
  font-size: 1.05rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.sa-brand-tag {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #c9a84c;
}

.sa-menu-label {
  margin: 1.25rem 0.5rem 0.5rem;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
}

.sa-nav {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.sa-nav-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #94a3b8;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.sa-nav-link:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #f1f5f9;
}

.sa-nav-link--active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  box-shadow: inset 3px 0 0 #c9a84c;
}

.sa-nav-icon {
  font-size: 0.95rem;
  opacity: 0.9;
}

.sa-sidebar-bottom {
  position: relative;
  z-index: 1;
  padding: 1rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sa-user {
  font-size: 0.8rem;
  color: #94a3b8;
  margin: 0 0 0.75rem;
  line-height: 1.35;
  word-break: break-word;
}

.sa-logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.sa-logout:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(201, 168, 76, 0.35);
  color: #f8fafc;
}

.sa-main {
  flex: 1;
  min-width: 0;
  background: #f1f5f9;
}

.sa-main-inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1.75rem 1.5rem 2.5rem;
}

@media (min-width: 1024px) {
  .sa-main-inner {
    padding: 2rem 2rem 3rem;
  }
}

/* Botones primarios (misma línea que el login) */
.sa-main :deep(.p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-contrast):not(.p-button-plain)) {
  background: #c9a84c;
  border-color: #b8943e;
  color: #0a1628;
  font-weight: 600;
}

.sa-main :deep(.p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-contrast):not(.p-button-plain):hover) {
  background: #b8943e;
  border-color: #a8883a;
  color: #0a1628;
}

.sa-main :deep(.p-card) {
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.sa-main :deep(.p-card .p-card-title) {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

@media (max-width: 768px) {
  .sa-shell {
    flex-direction: column;
  }

  .sa-sidebar {
    width: 100%;
  }

  .sa-sidebar-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .sa-logout {
    width: auto;
  }
}
</style>
