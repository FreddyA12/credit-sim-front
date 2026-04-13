<template>
  <div class="admin-shell">

    <!-- ── SIDEBAR ── -->
    <aside
      class="sidebar sidebar--dark"
      :style="sidebarVars"
    >
      <div class="dot-grid"></div>

      <!-- ── Cabecera con logo ── -->
      <div class="sb-header">
        <!-- Con logo -->
        <template v-if="institution?.logoUrl">
          <div class="sb-logo-frame">
            <img :src="institution.logoUrl" alt="logo" class="sb-logo" />
          </div>
          <div class="sb-header-text">
            <span class="sb-inst-name">{{ institution?.name || 'Institución' }}</span>
            <span class="sb-inst-sub">Panel de administración</span>
          </div>
        </template>

        <!-- Sin logo -->
        <template v-else>
          <div class="sb-logo-fallback">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L1 6.5v7L10 19l9-5.5v-7L10 1z" fill="currentColor" opacity="0.3"/>
              <path d="M10 1L1 6.5L10 12l9-5.5L10 1z" fill="currentColor" opacity="0.65"/>
              <path d="M10 12l9-5.5v7L10 19v-7z" fill="currentColor" opacity="0.45"/>
            </svg>
          </div>
          <div class="sb-header-text">
            <span class="sb-inst-name">{{ institution?.name || 'Admin' }}</span>
            <span class="sb-inst-sub">Panel de administración</span>
          </div>
        </template>
      </div>

      <!-- ── Separador ── -->
      <div class="sb-sep"></div>

      <!-- ── Navegación ── -->
      <nav class="sb-nav">
        <p class="sb-nav-label">Módulos</p>
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="sb-link"
          :class="{ 'sb-link--active': isActive(link.to) }"
        >
          <span class="sb-link-bar" v-if="isActive(link.to)"></span>
          <span class="sb-link-icon">
            <i :class="link.icon" />
          </span>
          <span class="sb-link-label">{{ link.label }}</span>
        </RouterLink>
      </nav>

      <!-- ── Usuario ── -->
      <div class="sb-user">
        <div class="sb-user-avatar" :style="avatarStyle">
          {{ userInitial }}
        </div>
        <div class="sb-user-info">
          <span class="sb-user-name">{{ user?.name || 'Administrador' }}</span>
          <span class="sb-user-sub">Admin</span>
        </div>
        <button class="sb-logout" @click="logout">
          <i class="pi pi-sign-out" />
          <span>Salir</span>
        </button>
      </div>
    </aside>

    <!-- ── CONTENIDO PRINCIPAL ── -->
    <main class="admin-main">
      <div class="admin-topbar">
        <div class="topbar-left">
          <div class="topbar-page-icon">
            <i :class="currentPageIcon" />
          </div>
          <div>
            <p class="topbar-page-name">{{ currentPageLabel }}</p>
            <p class="topbar-breadcrumb">
              <i class="pi pi-home" style="font-size:0.68rem" />
              <span class="tb-sep">/</span>
              {{ currentPageLabel }}
            </p>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-date">
            <i class="pi pi-calendar" style="font-size:0.72rem;opacity:0.5" />
            {{ formattedDate }}
          </div>
        </div>
      </div>
      <div class="admin-content">
        <RouterView />
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth.store';
import { useInstitutionStore } from '../stores/institution.store';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const router = useRouter();
const route = useRoute();

const DEFAULT_PRIMARY   = '#1A3C6E';
const DEFAULT_SECONDARY = '#F5A623';

const navLinks = [
  { to: '/admin/dashboard',               icon: 'pi pi-th-large',    label: 'Dashboard' },
  { to: '/admin/institution',             icon: 'pi pi-building',    label: 'Institución' },
  { to: '/admin/credit-types',            icon: 'pi pi-credit-card', label: 'Tipos de Crédito' },
  { to: '/admin/investment-products',     icon: 'pi pi-chart-line',  label: 'Inversiones' },
  { to: '/admin/credit-applications',     icon: 'pi pi-file-edit',   label: 'Sol. Crédito' },
  { to: '/admin/investment-applications', icon: 'pi pi-wallet',      label: 'Sol. Inversión' },
];

// ── ¿Paleta por defecto? ────────────────────────────────────────────────────
const sidebarVars = computed(() => {
  const primary   = institution.value?.primaryColor   || DEFAULT_PRIMARY;
  const secondary = institution.value?.secondaryColor || DEFAULT_SECONDARY;
  return {
    '--sb-primary':   primary,
    '--sb-secondary': secondary,
  };
});

function isActive(path: string) {
  return route.path.startsWith(path);
}

// Hex con opacidad para no depender de color-mix() (compatibilidad)
function hexWithOpacity(hex: string, opacity: number): string {
  const c = hex.replace('#', '');
  if (c.length !== 6) return hex;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

const activeLinkStyle = computed(() => {
  const p = institution.value?.primaryColor || '#1A3C6E';
  return { background: hexWithOpacity(p, 0.1), color: p, fontWeight: '600' };
});

const activeIconStyle = computed(() => {
  const p = institution.value?.primaryColor || '#1A3C6E';
  return { background: hexWithOpacity(p, 0.15), color: p };
});

const avatarStyle = computed(() => {
  const p = institution.value?.primaryColor || DEFAULT_PRIMARY;
  return {
    background: hexWithOpacity(p, 0.12),
    borderColor: hexWithOpacity(p, 0.4),
    color: p,
  };
});

const userInitial = computed(() =>
  (user.value?.name || 'A').charAt(0).toUpperCase()
);

const currentLink = computed(() =>
  navLinks.find(l => route.path.startsWith(l.to))
);
const currentPageLabel = computed(() => currentLink.value?.label || 'Panel');
const currentPageIcon  = computed(() => currentLink.value?.icon  || 'pi pi-home');

const formattedDate = computed(() =>
  new Intl.DateTimeFormat('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
);

function logout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  if (authStore.isAdmin) institutionStore.fetch().catch(() => {});
});
</script>

<style scoped>
/* ──────────────────────────────────────────────────────
   Shell
────────────────────────────────────────────────────── */
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f1f4f9;
  font-family: 'Poppins', sans-serif;
}

/* ──────────────────────────────────────────────────────
   Sidebar — base compartida
────────────────────────────────────────────────────── */
.sidebar {
  width: 252px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 10;
  transition: background 0.35s, box-shadow 0.35s;
}

/* ── Modo OSCURO ── */
.sidebar--dark {
  background: #0a1628;
}
.sidebar--dark .dot-grid {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(201,168,76,0.14) 1px, transparent 1px);
  background-size: 22px 22px;
  pointer-events: none;
  z-index: 0;
}
.sidebar--dark .sb-header        { position: relative; z-index: 1; }
.sidebar--dark .sb-logo-frame    { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
.sidebar--dark .sb-logo-fallback { color: #c9a84c; border-color: rgba(201,168,76,0.35); background: rgba(201,168,76,0.08); }
.sidebar--dark .sb-inst-name     { color: #ffffff; }
.sidebar--dark .sb-inst-sub      { color: rgba(255,255,255,0.5); letter-spacing: 0.08em; }
.sidebar--dark .sb-sep           { background: rgba(255,255,255,0.08); }
.sidebar--dark .sb-nav-label     { color: rgba(255,255,255,0.4); letter-spacing: 0.14em; }
.sidebar--dark .sb-link          { color: rgba(255,255,255,0.75); }
.sidebar--dark .sb-link:hover    { background: rgba(255,255,255,0.06); color: #ffffff; }
.sidebar--dark .sb-link--active  { background: rgba(201,168,76,0.14); color: #ffffff; font-weight: 600; }
.sidebar--dark .sb-link--active .sb-link-icon { background: rgba(201,168,76,0.22); color: #ffffff; }
.sidebar--dark .sb-link--active .sb-link-bar  { background: #c9a84c; }
.sidebar--dark .sb-link:hover .sb-link-icon   { background: rgba(255,255,255,0.1); color: #ffffff; }
.sidebar--dark .sb-user          { border-top-color: rgba(255,255,255,0.08); background: rgba(0,0,0,0.2); position: relative; z-index: 1; }
.sidebar--dark .sb-user-avatar   { background: rgba(201,168,76,0.18); border-color: rgba(201,168,76,0.45); color: #ffffff; }
.sidebar--dark .sb-user-name     { color: #ffffff; }
.sidebar--dark .sb-user-sub      { color: rgba(255,255,255,0.5); }
.sidebar--dark .sb-logout        { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.15); }
.sidebar--dark .sb-logout:hover  { color: #f87171; background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.35); }

/* ──────────────────────────────────────────────────────
   Elementos del sidebar — estructurales (sin color)
────────────────────────────────────────────────────── */
.sb-accent-strip {
  flex-shrink: 0;
  transition: background 0.35s;
}

.sb-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.1rem 1.25rem 1rem;
  position: relative;
  z-index: 1;
}

.sb-logo-frame {
  width: 2.8rem;
  height: 2.8rem;
  flex-shrink: 0;
  border-radius: 0.65rem;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.sb-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 0.2rem;
}

.sb-logo-fallback {
  width: 2.8rem;
  height: 2.8rem;
  flex-shrink: 0;
  border-radius: 0.65rem;
  border: 1.5px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.sb-header-text {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 0.1rem;
  position: relative;
  z-index: 1;
}
.sb-inst-name {
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.015em;
}
.sb-inst-sub {
  font-size: 0.59rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.sb-sep {
  height: 1px;
  margin: 0 1.25rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* Nav */
.sb-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  position: relative;
  z-index: 1;
}
.sb-nav-label {
  font-size: 0.58rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 0.6rem;
  margin: 0 0 0.5rem;
}
.sb-link {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.58rem 0.7rem;
  border-radius: 0.55rem;
  text-decoration: none;
  font-size: 0.81rem;
  font-weight: 500;
  transition: background 0.14s, color 0.14s;
}
.sb-link-bar {
  position: absolute;
  left: -0.75rem;
  top: 22%;
  bottom: 22%;
  width: 3px;
  border-radius: 0 2px 2px 0;
}
.sb-link-icon {
  width: 1.65rem;
  height: 1.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  font-size: 0.82rem;
  flex-shrink: 0;
  transition: background 0.14s, color 0.14s;
}
.sb-link-label { flex: 1; }

/* Usuario */
.sb-user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.9rem 1.1rem;
  border-top: 1px solid;
  position: relative;
  z-index: 1;
}
.sb-user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 1.5px solid;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sb-user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sb-user-name {
  font-size: 0.77rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sb-user-sub {
  font-size: 0.6rem;
  font-weight: 500;
}
.sb-logout {
  background: none;
  border: 1.5px solid;
  cursor: pointer;
  font-size: 0.76rem;
  padding: 0.32rem 0.55rem;
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  transition: color 0.14s, background 0.14s, border-color 0.14s;
  white-space: nowrap;
}

/* ──────────────────────────────────────────────────────
   Área principal
────────────────────────────────────────────────────── */
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  background: #ffffff;
  border-bottom: 1px solid #e8ecf2;
  padding: 0.75rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 5;
}
.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.topbar-page-icon {
  font-size: 1rem;
  color: v-bind("institution?.primaryColor || '#1A3C6E'");
  transition: color 0.3s;
}
.topbar-page-name {
  font-size: 0.88rem;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
  line-height: 1.2;
}
.topbar-breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  color: #94a3b8;
  margin: 0;
}
.tb-sep { opacity: 0.4; }
.topbar-right {
  display: flex;
  align-items: center;
}
.topbar-date {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: #94a3b8;
  text-transform: capitalize;
  font-weight: 500;
}

.admin-content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
</style>
