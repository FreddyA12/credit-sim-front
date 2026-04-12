import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useInstitutionStore } from '../stores/institution.store';

/** Login y SuperAdmin: diseño fijo (navy/dorado); no aplica colores de institución. */
function usesFixedAppChrome(path: string): boolean {
  return (
    path === '/login' ||
    path.startsWith('/login/') ||
    path === '/superadmin' ||
    path.startsWith('/superadmin/')
  );
}

function clearInstitutionThemeFromDocument(): void {
  document.querySelectorAll('#institution-theme').forEach((el) => el.remove());
  const root = document.documentElement;
  root.style.removeProperty('--primary-color');
  root.style.removeProperty('--p-primary-color');
  root.style.removeProperty('--secondary-color');
  root.style.removeProperty('--p-primary-600');
}

export function useTheme() {
  const institutionStore = useInstitutionStore();
  const route = useRoute();
  let applyThemeTimeout: number | null = null;

  const applyTheme = () => {
    if (usesFixedAppChrome(route.path)) {
      clearInstitutionThemeFromDocument();
      return;
    }

    const institution = institutionStore.institution;
    if (!institution) return;

    // Debounce para evitar múltiples ejecuciones rápidas
    if (applyThemeTimeout) {
      clearTimeout(applyThemeTimeout);
    }

    applyThemeTimeout = window.setTimeout(() => {
      const root = document.documentElement;

      // Aplicar colores primarios y secundarios como variables CSS
      if (institution.primaryColor) {
        root.style.setProperty('--primary-color', institution.primaryColor);
        root.style.setProperty('--p-primary-color', institution.primaryColor);
      }

      if (institution.secondaryColor) {
        root.style.setProperty('--secondary-color', institution.secondaryColor);
        root.style.setProperty('--p-primary-600', institution.secondaryColor);
      }

      // Eliminar TODOS los estilos anteriores si existen (por si hay duplicados)
      document.querySelectorAll('#institution-theme').forEach(el => el.remove());

      // Aplicar colores de PrimeVue dinámicamente
      const style = document.createElement('style');
      style.id = 'institution-theme';

      style.textContent = `
      :root {
        --primary-color: ${institution.primaryColor};
        --secondary-color: ${institution.secondaryColor};
      }

      /* PrimeVue Button Primary */
      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast) {
        background-color: ${institution.primaryColor} !important;
        border-color: ${institution.primaryColor} !important;
        color: #ffffff !important;
      }

      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast):hover {
        background-color: ${adjustBrightness(institution.primaryColor, -10)} !important;
        border-color: ${adjustBrightness(institution.primaryColor, -10)} !important;
        color: #ffffff !important;
      }

      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast) .p-button-icon {
        color: inherit !important;
      }

      /* PrimeVue Select (Dropdown) */
      .p-select:not(.p-disabled).p-focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      .p-select:not(.p-disabled).p-focus .p-select-dropdown,
      .p-select:not(.p-disabled).p-focus .p-icon {
        color: ${institution.primaryColor} !important;
      }

      /* PrimeVue InputText */
      .p-inputtext:enabled:focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      /* PrimeVue Textarea */
      .p-textarea:enabled:focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      /* PrimeVue Checkbox */
      .p-checkbox .p-checkbox-box.p-highlight {
        background-color: ${institution.primaryColor} !important;
        border-color: ${institution.primaryColor} !important;
      }

      /* PrimeVue TabView */
      .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
        border-color: ${institution.primaryColor} !important;
        color: ${institution.primaryColor} !important;
      }

      /* Links y elementos secundarios */
      a, .link-color {
        color: ${institution.primaryColor} !important;
      }

      a:hover, .link-color:hover {
        color: ${adjustBrightness(institution.primaryColor, -15)} !important;
      }

      /* Badges y pills con color secundario */
      .badge-secondary {
        background-color: ${institution.secondaryColor} !important;
      }

      /* DataTable headers */
      .p-datatable .p-datatable-thead > tr > th {
        background-color: ${hexToRgba(institution.primaryColor, 0.1)} !important;
        color: ${institution.primaryColor} !important;
      }

      /* Card headers personalizados */
      .card-header-primary {
        background-color: ${institution.primaryColor} !important;
        color: white !important;
      }

      /* Progress Bar */
      .p-progressbar .p-progressbar-value {
        background-color: ${institution.primaryColor} !important;
      }

      /* Toggle Switch */
      .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
        background-color: ${institution.primaryColor} !important;
      }
    `;

      document.head.appendChild(style);
      applyThemeTimeout = null;
    }, 50); // Debounce de 50ms para evitar múltiples ejecuciones
  };

  // Helper para ajustar brillo
  function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + percent));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  // Helper para convertir hex a rgba
  function hexToRgba(hex: string, alpha: number = 1): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Aplicar tema cuando cambie la institución o la ruta (p. ej. salir de /login hacia admin)
  const stopWatch = watch(
    () => [institutionStore.institution, route.path] as const,
    () => {
      applyTheme();
    },
    { immediate: true, deep: true }
  );

  // Versión inmediata sin debounce (útil para reset)
  const applyThemeImmediate = () => {
    if (applyThemeTimeout) {
      clearTimeout(applyThemeTimeout);
      applyThemeTimeout = null;
    }

    if (usesFixedAppChrome(route.path)) {
      clearInstitutionThemeFromDocument();
      return;
    }

    const institution = institutionStore.institution;
    if (!institution) return;

    const root = document.documentElement;

    // Aplicar colores primarios y secundarios como variables CSS
    if (institution.primaryColor) {
      root.style.setProperty('--primary-color', institution.primaryColor);
      root.style.setProperty('--p-primary-color', institution.primaryColor);
    }

    if (institution.secondaryColor) {
      root.style.setProperty('--secondary-color', institution.secondaryColor);
      root.style.setProperty('--p-primary-600', institution.secondaryColor);
    }

    // Eliminar TODOS los estilos anteriores si existen
    document.querySelectorAll('#institution-theme').forEach(el => el.remove());

    // Crear nuevo estilo
    const style = document.createElement('style');
    style.id = 'institution-theme';

    style.textContent = `
      :root {
        --primary-color: ${institution.primaryColor};
        --secondary-color: ${institution.secondaryColor};
      }

      /* PrimeVue Button Primary */
      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast) {
        background-color: ${institution.primaryColor} !important;
        border-color: ${institution.primaryColor} !important;
        color: #ffffff !important;
      }

      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast):hover {
        background-color: ${adjustBrightness(institution.primaryColor, -10)} !important;
        border-color: ${adjustBrightness(institution.primaryColor, -10)} !important;
        color: #ffffff !important;
      }

      .p-button:not(.p-button-outlined):not(.p-button-text):not(.p-button-secondary):not(.p-button-success):not(.p-button-danger):not(.p-button-info):not(.p-button-help):not(.p-button-warn):not(.p-button-contrast) .p-button-icon {
        color: inherit !important;
      }

      /* PrimeVue Select (Dropdown) */
      .p-select:not(.p-disabled).p-focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      .p-select:not(.p-disabled).p-focus .p-select-dropdown,
      .p-select:not(.p-disabled).p-focus .p-icon {
        color: ${institution.primaryColor} !important;
      }

      /* PrimeVue InputText */
      .p-inputtext:enabled:focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      /* PrimeVue Textarea */
      .p-textarea:enabled:focus {
        border-color: ${institution.primaryColor} !important;
        box-shadow: 0 0 0 0.2rem ${hexToRgba(institution.primaryColor, 0.25)} !important;
      }

      /* PrimeVue Checkbox */
      .p-checkbox .p-checkbox-box.p-highlight {
        background-color: ${institution.primaryColor} !important;
        border-color: ${institution.primaryColor} !important;
      }

      /* PrimeVue TabView */
      .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
        border-color: ${institution.primaryColor} !important;
        color: ${institution.primaryColor} !important;
      }

      /* Links y elementos secundarios */
      a, .link-color {
        color: ${institution.primaryColor} !important;
      }

      a:hover, .link-color:hover {
        color: ${adjustBrightness(institution.primaryColor, -15)} !important;
      }

      /* Badges y pills con color secundario */
      .badge-secondary {
        background-color: ${institution.secondaryColor} !important;
      }

      /* DataTable headers */
      .p-datatable .p-datatable-thead > tr > th {
        background-color: ${hexToRgba(institution.primaryColor, 0.1)} !important;
        color: ${institution.primaryColor} !important;
      }

      /* Card headers personalizados */
      .card-header-primary {
        background-color: ${institution.primaryColor} !important;
        color: white !important;
      }

      /* Progress Bar */
      .p-progressbar .p-progressbar-value {
        background-color: ${institution.primaryColor} !important;
      }

      /* Toggle Switch */
      .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
        background-color: ${institution.primaryColor} !important;
      }
    `;

    document.head.appendChild(style);
  };

  // Cleanup al desmontar
  const cleanup = () => {
    if (applyThemeTimeout) {
      clearTimeout(applyThemeTimeout);
    }
    stopWatch();
  };

  return {
    applyTheme,
    applyThemeImmediate,
    cleanup
  };
}
