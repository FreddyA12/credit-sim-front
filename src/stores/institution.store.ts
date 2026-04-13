import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export interface Institution {
  id: string;
  slug: string;
  name: string;
  type: string;
  ruc: string;
  address: string;
  phone: string;
  email: string;
  slogan: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  // Información Corporativa Extendida
  legalName?: string | null;
  commercialName?: string | null;
  superintendenciaRegistry?: string | null;
  foundationDate?: string | null;
  mission?: string | null;
  vision?: string | null;
  description?: string | null;
  website?: string | null;
  // Redes Sociales
  facebook?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  linkedin?: string | null;
  // Branding
  logoAltUrl?: string | null;
  faviconUrl?: string | null;
  primaryFont?: string | null;
  watermarkUrl?: string | null;
}

export const useInstitutionStore = defineStore('institution', () => {
  const institution = ref<Institution | null>(null);

  async function fetch() {
    const { data } = await api.get('/institution');
    institution.value = data;
  }

  async function fetchBySlug(slug: string) {
    const { data } = await api.get(`/public/${slug}`);
    institution.value = data;
  }

  async function update(payload: Partial<Institution>) {
    const { data } = await api.put('/institution', payload);
    institution.value = data;
  }

  async function uploadLogo(file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/institution/logo', form);
    if (institution.value) institution.value.logoUrl = data.logoUrl;
  }

  async function uploadLogoAlt(file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/institution/logo-alt', form);
    if (institution.value) institution.value.logoAltUrl = data.logoAltUrl;
  }

  async function uploadFavicon(file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/institution/favicon', form);
    if (institution.value) institution.value.faviconUrl = data.faviconUrl;
  }

  async function uploadWatermark(file: File) {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post('/institution/watermark', form);
    if (institution.value) institution.value.watermarkUrl = data.watermarkUrl;
  }

  return {
    institution,
    fetch,
    fetchBySlug,
    update,
    uploadLogo,
    uploadLogoAlt,
    uploadFavicon,
    uploadWatermark
  };
});
