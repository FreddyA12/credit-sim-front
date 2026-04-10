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

  return { institution, fetch, fetchBySlug, update, uploadLogo };
});
