import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useCreditStore = defineStore('credit', () => {
  const creditTypes = ref<any[]>([]);
  const simulation = ref<any | null>(null);

  async function fetchTypes() {
    const { data } = await api.get('/credit-types');
    creditTypes.value = data;
  }

  async function simulate(payload: object) {
    const { data } = await api.post('/credits/simulate', payload);
    simulation.value = data;
    return data;
  }

  async function createType(payload: object) {
    const { data } = await api.post('/credit-types', payload);
    creditTypes.value.push(data);
    return data;
  }

  async function updateType(id: number, payload: object) {
    const { data } = await api.put(`/credit-types/${id}`, payload);
    const idx = creditTypes.value.findIndex((t) => t.id === id);
    if (idx !== -1) creditTypes.value[idx] = data;
    return data;
  }

  async function deleteType(id: number) {
    await api.delete(`/credit-types/${id}`);
    creditTypes.value = creditTypes.value.filter((t) => t.id !== id);
  }

  return { creditTypes, simulation, fetchTypes, simulate, createType, updateType, deleteType };
});
