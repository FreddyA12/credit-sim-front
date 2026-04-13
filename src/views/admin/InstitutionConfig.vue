<template>
  <div class="inst-page" :style="cssVars">

    <!-- ── Encabezado ── -->
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon">
          <i class="pi pi-building" />
        </div>
        <div>
          <h1 class="page-title">Configuración de la Institución</h1>
          <p class="page-subtitle">Gestiona la información, contacto y branding de tu institución</p>
        </div>
      </div>
      <div class="page-header-right">
        <div v-if="institution?.type" class="inst-badge">
          {{ typeLabel }}
        </div>
        <a
          v-if="institution?.slug"
          :href="`${origin}/${institution.slug}`"
          target="_blank"
          class="slug-link"
        >
          <i class="pi pi-link" />
          {{ origin }}/{{ institution.slug }}
        </a>
      </div>
    </div>

    <!-- ── Tabs personalizados ── -->
    <div class="tabs-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === tab.key }"
        :style="activeTab === tab.key ? tabActiveStyle : {}"
        @click="activeTab = tab.key"
      >
        <i :class="tab.icon" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ── Panel: Información General ── -->
    <div v-if="activeTab === 'general'" class="panel">
      <div class="panel-section">
        <div class="section-head">
          <i class="pi pi-info-circle section-icon" />
          <div>
            <h2 class="section-title">Datos generales</h2>
            <p class="section-desc">Nombre, tipo de entidad y descripción institucional</p>
          </div>
        </div>

        <form @submit.prevent="save" class="form-grid">
          <div class="field">
            <label class="field-label">Nombre de la Institución <span class="req">*</span></label>
            <div class="input-wrap">
              <i class="pi pi-tag input-icon" />
              <input
                v-model="form.name"
                type="text"
                class="inst-input"
                placeholder="Ej. Cooperativa San Andrés"
                required
              />
            </div>
          </div>

          <div class="field">
            <label class="field-label">Tipo de Institución <span class="req">*</span></label>
            <Select
              v-model="form.type"
              :options="typeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecciona un tipo"
              class="inst-select"
              required
            />
          </div>

          <div class="field">
            <label class="field-label">RUC</label>
            <div class="input-wrap">
              <i class="pi pi-id-card input-icon" />
              <input
                v-model="form.ruc"
                type="text"
                class="inst-input"
                maxlength="13"
                placeholder="1234567890001"
              />
            </div>
          </div>

          <div class="field field--full">
            <label class="field-label">Slogan</label>
            <div class="input-wrap">
              <i class="pi pi-comment input-icon" />
              <input
                v-model="form.slogan"
                type="text"
                class="inst-input"
                placeholder="Juntos construimos el futuro..."
              />
            </div>
          </div>

          <div class="field field--full">
            <label class="field-label">Misión</label>
            <textarea
              v-model="form.mission"
              class="inst-textarea"
              rows="3"
              placeholder="¿Cuál es la razón de ser de la institución?"
            />
          </div>

          <div class="field field--full">
            <label class="field-label">Visión</label>
            <textarea
              v-model="form.vision"
              class="inst-textarea"
              rows="3"
              placeholder="¿A dónde quiere llegar la institución?"
            />
          </div>

          <div class="form-footer">
            <button type="submit" class="save-btn" :style="btnStyle" :disabled="saving">
              <i class="pi" :class="saving ? 'pi-spin pi-spinner' : 'pi-save'" />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Panel: Contacto ── -->
    <div v-if="activeTab === 'contact'" class="panel">
      <div class="panel-section">
        <div class="section-head">
          <i class="pi pi-phone section-icon" />
          <div>
            <h2 class="section-title">Información de contacto</h2>
            <p class="section-desc">Dirección, teléfono y correo institucional</p>
          </div>
        </div>

        <form @submit.prevent="save" class="form-grid">
          <div class="field field--full">
            <label class="field-label">Dirección Física</label>
            <div class="input-wrap">
              <i class="pi pi-map-marker input-icon" />
              <input
                v-model="form.address"
                type="text"
                class="inst-input"
                placeholder="Av. Principal y calle secundaria, ciudad"
              />
            </div>
          </div>

          <div class="field">
            <label class="field-label">Teléfono Principal</label>
            <div class="input-wrap">
              <i class="pi pi-phone input-icon" />
              <input
                v-model="form.phone"
                type="text"
                class="inst-input"
                placeholder="0987654321"
              />
            </div>
          </div>

          <div class="field">
            <label class="field-label">Correo Institucional</label>
            <div class="input-wrap">
              <i class="pi pi-envelope input-icon" />
              <input
                v-model="form.email"
                type="email"
                class="inst-input"
                placeholder="contacto@institucion.ec"
              />
            </div>
          </div>

          <div class="form-footer">
            <button type="submit" class="save-btn" :style="btnStyle" :disabled="saving">
              <i class="pi" :class="saving ? 'pi-spin pi-spinner' : 'pi-save'" />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ── Panel: Branding ── -->
    <div v-if="activeTab === 'branding'" class="panel">

      <!-- Logo -->
      <div class="panel-section">
        <div class="section-head">
          <i class="pi pi-image section-icon" />
          <div>
            <h2 class="section-title">Logo institucional</h2>
            <p class="section-desc">PNG, JPG o WEBP · máx. 2 MB</p>
          </div>
        </div>

        <div class="logo-zone">
          <!-- Preview: local (recién seleccionado) o guardado -->
          <div class="logo-preview" :class="{ 'logo-preview--uploading': uploadingLogo }">
            <img
              v-if="localLogoPreview || institution?.logoUrl"
              :src="localLogoPreview || institution?.logoUrl || ''"
              alt="logo"
              class="logo-img"
            />
            <div v-else class="logo-placeholder">
              <i class="pi pi-image" />
              <span>Sin logo</span>
            </div>
            <div v-if="uploadingLogo" class="logo-uploading-overlay">
              <i class="pi pi-spin pi-spinner" />
            </div>
          </div>

          <div class="logo-actions">
            <p class="logo-hint">
              El logotipo se muestra en el panel y en la plataforma de clientes.
              La imagen se sube automáticamente al seleccionarla.
            </p>

            <!-- Input nativo oculto -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              class="file-input-hidden"
              @change="onFileChange"
            />

            <div class="logo-btn-row">
              <button type="button" class="upload-btn" @click="triggerFileInput" :disabled="uploadingLogo">
                <i class="pi" :class="uploadingLogo ? 'pi-spin pi-spinner' : 'pi-upload'" />
                {{ uploadingLogo ? 'Subiendo...' : 'Cambiar logo' }}
              </button>
              <button
                v-if="institution?.logoUrl"
                type="button"
                class="remove-btn"
                @click="localLogoPreview = null"
                :disabled="uploadingLogo"
              >
                <i class="pi pi-trash" />
                Quitar vista
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Colores -->
      <div class="panel-section">
        <div class="section-head">
          <i class="pi pi-palette section-icon" />
          <div>
            <h2 class="section-title">Paleta de colores</h2>
            <p class="section-desc">Define los colores de marca que se aplicarán en toda la plataforma</p>
          </div>
        </div>

        <form @submit.prevent="save">
          <div class="colors-grid">

            <!-- Color primario -->
            <div class="color-card">
              <div class="color-card-preview" :style="{ background: form.primaryColor }">
                <span class="color-card-label-over">Primario</span>
              </div>
              <div class="color-card-body">
                <label class="field-label">Color Primario</label>
                <div class="color-input-row">
                  <div class="color-swatch-wrap">
                    <input type="color" v-model="form.primaryColor" class="color-swatch" />
                  </div>
                  <div class="input-wrap flex-1">
                    <input
                      v-model="form.primaryColor"
                      type="text"
                      class="inst-input mono"
                      placeholder="#1A3C6E"
                      maxlength="7"
                    />
                  </div>
                </div>
                <p class="field-hint">Color principal de la marca</p>
              </div>
            </div>

            <!-- Color secundario -->
            <div class="color-card">
              <div class="color-card-preview" :style="{ background: form.secondaryColor }">
                <span class="color-card-label-over">Secundario</span>
              </div>
              <div class="color-card-body">
                <label class="field-label">Color Secundario</label>
                <div class="color-input-row">
                  <div class="color-swatch-wrap">
                    <input type="color" v-model="form.secondaryColor" class="color-swatch" />
                  </div>
                  <div class="input-wrap flex-1">
                    <input
                      v-model="form.secondaryColor"
                      type="text"
                      class="inst-input mono"
                      placeholder="#F5A623"
                      maxlength="7"
                    />
                  </div>
                </div>
                <p class="field-hint">Color de acento y complemento</p>
              </div>
            </div>

          </div>

          <!-- Preview live -->
          <div class="theme-preview">
            <p class="theme-preview-label">Vista previa del tema</p>
            <div class="theme-preview-bar" :style="{ background: form.primaryColor }">
              <img
                v-if="localLogoPreview || institution?.logoUrl"
                :src="localLogoPreview || institution?.logoUrl || ''"
                class="tp-logo"
                alt="logo"
              />
              <div v-else class="tp-brand-dot" :style="{ background: form.secondaryColor }"></div>
              <span class="tp-brand-name">{{ form.name || institution?.name || 'Institución' }}</span>
              <div class="tp-actions">
                <div class="tp-pill" :style="{ background: form.secondaryColor, color: contrastColor(form.secondaryColor) }">Activo</div>
              </div>
            </div>
          </div>

          <div class="form-footer">
            <button type="submit" class="save-btn" :style="btnStyleLive" :disabled="saving">
              <i class="pi" :class="saving ? 'pi-spin pi-spinner' : 'pi-save'" />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useToast } from 'primevue/usetoast';
import Select from 'primevue/select';
import { useInstitutionStore } from '../../stores/institution.store';
import { useTheme } from '../../composables/useTheme';

const toast = useToast();
const institutionStore = useInstitutionStore();
const { institution } = storeToRefs(institutionStore);
const { applyTheme } = useTheme();
const saving = ref(false);
const uploadingLogo = ref(false);
const localLogoPreview = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const activeTab = ref<'general' | 'contact' | 'branding'>('general');

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Colores de marca en vivo (formulario) o guardados, para iconos y focos de esta pantalla */
const cssVars = computed(() => {
  const p = form.value.primaryColor || institution.value?.primaryColor || '#1A3C6E';
  const s = form.value.secondaryColor || institution.value?.secondaryColor || '#F5A623';
  return {
    '--inst-primary': p,
    '--inst-secondary': s,
    '--inst-primary-ring': hexToRgba(p, 0.18),
  };
});

const origin = window.location.origin;

const tabs = [
  { key: 'general',  icon: 'pi pi-file-edit',  label: 'Información General' },
  { key: 'contact',  icon: 'pi pi-phone',       label: 'Contacto' },
  { key: 'branding', icon: 'pi pi-palette',     label: 'Branding' },
] as const;

const typeOptions = [
  { label: 'Banco Privado',  value: 'private_bank' },
  { label: 'Banco Público',  value: 'public_bank' },
  { label: 'Cooperativa',    value: 'cooperative' },
  { label: 'Mutualista',     value: 'mutual' },
];

const typeLabel = computed(() =>
  typeOptions.find(o => o.value === institution.value?.type)?.label ?? ''
);

// ── Utilidad de contraste ──────────────────────────────────────────────────
// Calcula la luminancia percibida (WCAG) de un color hex y devuelve
// blanco o negro según cuál sea más legible sobre ese fondo.
function contrastColor(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#0a1628' : '#ffffff';
}

// Estilo del botón usando el color guardado (pestañas General y Contacto)
const btnStyle = computed(() => {
  const bg = institution.value?.primaryColor || '#0a1628';
  return { background: bg, color: contrastColor(bg) };
});

// Estilo del botón usando el color en vivo del form (pestaña Branding — preview inmediato)
const btnStyleLive = computed(() => {
  const bg = form.value.primaryColor || '#0a1628';
  return { background: bg, color: contrastColor(bg) };
});

// Estilo del tab activo usando el color guardado
const tabActiveStyle = computed(() => {
  const bg = institution.value?.primaryColor || '#0a1628';
  return { background: bg, color: contrastColor(bg) };
});

const form = ref({
  name:           '',
  type:           '',
  ruc:            '',
  address:        '',
  phone:          '',
  email:          '',
  slogan:         '',
  primaryColor:   '#1A3C6E',
  secondaryColor: '#F5A623',
  mission:        '',
  vision:         '',
});

watch(institution, (val) => {
  if (val) {
    form.value = {
      name:           val.name           || '',
      type:           val.type           || '',
      ruc:            val.ruc            || '',
      address:        val.address        || '',
      phone:          val.phone          || '',
      email:          val.email          || '',
      slogan:         val.slogan         || '',
      primaryColor:   val.primaryColor   || '#1A3C6E',
      secondaryColor: val.secondaryColor || '#F5A623',
      mission:        val.mission        || '',
      vision:         val.vision         || '',
    };
  }
}, { immediate: true });

onMounted(() => institutionStore.fetch());

async function save() {
  saving.value = true;
  try {
    await institutionStore.update(form.value);
    applyTheme();
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Institución actualizada correctamente', life: 3000 });
  } catch (error: any) {
    const detail = error?.response?.data?.message || 'No se pudo guardar la información';
    toast.add({ severity: 'error', summary: 'Error', detail, life: 3000 });
  } finally {
    saving.value = false;
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // Mostrar preview local inmediatamente
  if (localLogoPreview.value) URL.revokeObjectURL(localLogoPreview.value);
  localLogoPreview.value = URL.createObjectURL(file);

  // Subir al servidor
  uploadingLogo.value = true;
  try {
    await institutionStore.uploadLogo(file);
    // Refrescar para traer la URL real del servidor
    await institutionStore.fetch();
    // Mantener localLogoPreview como fallback visual;
    // el sidebar usará institution.logoUrl (reactivo) automáticamente
    toast.add({ severity: 'success', summary: 'Logo actualizado', detail: 'El logo se guardó correctamente', life: 3000 });
  } catch (err: any) {
    const detail = err?.response?.data?.message || 'No se pudo subir el logo';
    toast.add({ severity: 'error', summary: 'Error al subir', detail, life: 4000 });
    // Solo revertimos preview si falló
    if (localLogoPreview.value) {
      URL.revokeObjectURL(localLogoPreview.value);
      localLogoPreview.value = null;
    }
  } finally {
    uploadingLogo.value = false;
    if (input) input.value = '';
  }
}

</script>

<style scoped>
/* ──────────────────────────────────────────
   Página
────────────────────────────────────────── */
.inst-page {
  font-family: 'Poppins', sans-serif;
  --inst-primary: #1a3c6e;
  --inst-secondary: #f5a623;
  --inst-primary-ring: rgba(26, 60, 110, 0.18);
}

/* ── Encabezado ── */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.75rem;
  gap: 1rem;
}
.page-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.page-header-icon {
  width: 2.8rem;
  height: 2.8rem;
  background: var(--inst-primary);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 1.1rem;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
}
.page-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--inst-primary);
  margin: 0 0 0.15rem;
  letter-spacing: -0.03em;
}
.page-subtitle {
  font-size: 0.77rem;
  color: #94a3b8;
  margin: 0;
  font-weight: 400;
}
.inst-badge {
  background: rgba(10, 22, 40, 0.06);
  color: #1e293b;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(10, 22, 40, 0.08);
  white-space: nowrap;
}
.slug-link {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--inst-primary, #1A3C6E);
  text-decoration: none;
  padding: 0.3rem 0.85rem;
  border-radius: 9999px;
  border: 1px solid rgba(var(--inst-primary, #1A3C6E), 0.2);
  background: rgba(26, 60, 110, 0.05);
  white-space: nowrap;
  transition: background 0.15s;
}
.slug-link:hover {
  background: rgba(26, 60, 110, 0.1);
}

/* ── Tabs ── */
.tabs-bar {
  display: flex;
  gap: 0.3rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.35rem;
  margin-bottom: 1.5rem;
  width: fit-content;
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border: none;
  background: none;
  border-radius: 0.55rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}
.tab-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}
.tab-btn--active {
  /* background y color vienen del :style dinámico */
  font-weight: 600;
}
.tab-btn--active:hover {
  filter: brightness(1.08);
}

/* ── Panel ── */
.panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.panel-section {
  background: #ffffff;
  border: 1px solid #e8ecf2;
  border-radius: 1rem;
  padding: 1.75rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}
.mt-section {
  margin-top: 0;
}

/* Cabecera de sección */
.section-head {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid #f1f5f9;
}
.section-icon {
  color: var(--inst-primary);
  font-size: 1rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}
.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--inst-primary);
  margin: 0 0 0.2rem;
}
.section-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

/* ── Formulario ── */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field--full {
  grid-column: 1 / -1;
}
.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #334155;
  letter-spacing: 0.01em;
}
.req {
  color: var(--inst-primary);
}
.field-hint {
  font-size: 0.68rem;
  color: #94a3b8;
  margin: 0.15rem 0 0;
}

/* Input con icono */
.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 0.85rem;
  color: #94a3b8;
  font-size: 0.82rem;
  pointer-events: none;
  z-index: 1;
}
.inst-input {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.62rem 0.9rem 0.62rem 2.2rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.83rem;
  color: #0f172a;
  background: #f8fafc;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  outline: none;
  box-sizing: border-box;
}
.inst-input:focus {
  border-color: var(--inst-primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--inst-primary-ring);
}
.inst-input.mono {
  font-family: 'Courier New', monospace;
  font-size: 0.82rem;
  letter-spacing: 0.05em;
}
.inst-textarea {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  padding: 0.65rem 0.9rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.83rem;
  color: #0f172a;
  background: #f8fafc;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  line-height: 1.55;
  box-sizing: border-box;
}
.inst-textarea:focus {
  border-color: var(--inst-primary);
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--inst-primary-ring);
}

/* Select de PrimeVue */
:deep(.inst-select) {
  width: 100%;
}
:deep(.inst-select .p-select) {
  width: 100%;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.6rem;
  background: #f8fafc;
  font-family: 'Poppins', sans-serif;
  font-size: 0.83rem;
}
:deep(.inst-select .p-select:not(.p-disabled).p-focus) {
  border-color: var(--inst-primary);
  box-shadow: 0 0 0 3px var(--inst-primary-ring);
}

/* Footer del form */
.form-footer {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid #f1f5f9;
  margin-top: 0.5rem;
}
.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  /* background y color vienen del :style dinámico (usa el primaryColor de la institución) */
  background: #0a1628;
  color: #ffffff;
  border: none;
  border-radius: 0.6rem;
  padding: 0.65rem 1.5rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.83rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s, box-shadow 0.15s, transform 0.1s;
  letter-spacing: 0.02em;
}
.save-btn:hover:not(:disabled) {
  filter: brightness(1.12);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}
.save-btn:active {
  transform: translateY(0);
  filter: brightness(0.95);
}
.save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

/* ── Logo zone ── */
.logo-zone {
  display: flex;
  align-items: center;
  gap: 1.75rem;
}
.logo-preview {
  width: 7.5rem;
  height: 7.5rem;
  flex-shrink: 0;
  border: 2px dashed #e2e8f0;
  border-radius: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s;
}
.logo-preview--uploading {
  border-color: var(--inst-primary);
}
.logo-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  padding: 0.5rem;
}
.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  color: #cbd5e1;
  font-size: 0.72rem;
}
.logo-placeholder i {
  font-size: 1.75rem;
}
.logo-uploading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: var(--inst-primary);
}
.logo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.logo-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
  max-width: 360px;
  line-height: 1.6;
}
.file-input-hidden {
  display: none;
}
.logo-btn-row {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: var(--inst-primary);
  color: #ffffff;
  border: none;
  border-radius: 0.55rem;
  padding: 0.58rem 1.2rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.14s, box-shadow 0.14s;
}
.upload-btn:hover:not(:disabled) {
  filter: brightness(1.08);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}
.upload-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.remove-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: none;
  color: #94a3b8;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.55rem;
  padding: 0.58rem 1rem;
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.14s, border-color 0.14s, background 0.14s;
}
.remove-btn:hover:not(:disabled) {
  color: #ef4444;
  border-color: #fca5a5;
  background: #fef2f2;
}
.remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Logo en theme preview */
.tp-logo {
  width: 1.6rem;
  height: 1.6rem;
  object-fit: contain;
  border-radius: 0.3rem;
  background: rgba(255,255,255,0.12);
  padding: 0.1rem;
  flex-shrink: 0;
}

/* ── Colores ── */
.colors-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.5rem;
}
.color-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 0.85rem;
  overflow: hidden;
  background: #ffffff;
}
.color-card-preview {
  height: 4.5rem;
  position: relative;
  display: flex;
  align-items: flex-end;
  padding: 0.6rem 0.85rem;
  transition: background 0.2s;
}
.color-card-label-over {
  font-size: 0.68rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.color-card-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.color-input-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.color-swatch-wrap {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.45rem;
  overflow: hidden;
  border: 1.5px solid #e2e8f0;
  flex-shrink: 0;
  cursor: pointer;
}
.color-swatch {
  width: 130%;
  height: 130%;
  border: none;
  padding: 0;
  cursor: pointer;
  transform: translate(-10%, -10%);
}
.flex-1 { flex: 1; }

/* ── Theme preview ── */
.theme-preview {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.theme-preview-label {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #94a3b8;
  padding: 0.6rem 1rem 0.4rem;
  margin: 0;
}
.theme-preview-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.25rem;
  transition: background 0.25s;
}
.tp-brand-dot {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.25s;
}
.tp-brand-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tp-actions { display: flex; gap: 0.5rem; }
.tp-pill {
  font-size: 0.65rem;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.7);
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  transition: background 0.25s;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .field--full {
    grid-column: 1;
  }
  .colors-grid {
    grid-template-columns: 1fr;
  }
  .logo-zone {
    flex-direction: column;
    align-items: flex-start;
  }
  .tabs-bar {
    width: 100%;
    overflow-x: auto;
  }
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
