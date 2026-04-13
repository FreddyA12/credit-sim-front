import { ref, computed } from 'vue';
import api from '../services/api';

export interface CreditBureauResult {
  score: number;
  rating: string;
  riskLevel: 'bajo' | 'medio' | 'alto';
}

export function useCreditBureau() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const result = ref<CreditBureauResult | null>(null);

  const checkCedula = async (cedula: string) => {
    if (!cedula || !/^\d{10}$/.test(cedula)) {
      error.value = 'Cédula inválida. Debe contener 10 dígitos';
      result.value = null;
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await api.post('/credit-bureau/check', { cedula });
      result.value = response.data;
      error.value = null;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al consultar el buró de crédito';
      result.value = null;
    } finally {
      loading.value = false;
    }
  };

  const getRatingColor = computed(() => {
    if (!result.value) return 'gray';
    switch (result.value.riskLevel) {
      case 'bajo':
        return 'green';
      case 'medio':
        return 'yellow';
      case 'alto':
        return 'red';
      default:
        return 'gray';
    }
  });

  const reset = () => {
    result.value = null;
    error.value = null;
    loading.value = false;
  };

  return {
    loading,
    error,
    result,
    checkCedula,
    getRatingColor,
    reset,
  };
}
