import { ref } from 'vue';
import { validateCedula } from '../utils/cedula-validator';
import { validateRuc } from '../utils/ruc-validator';

export function useIdentityValidation() {
  const cedulaError = ref('');
  const rucError = ref('');

  function checkCedula(value: string): boolean {
    if (!value) { cedulaError.value = 'La cédula es requerida'; return false; }
    if (!validateCedula(value)) { cedulaError.value = 'Cédula inválida'; return false; }
    cedulaError.value = '';
    return true;
  }

  function checkRuc(value: string): boolean {
    if (!value) { rucError.value = 'El RUC es requerido'; return false; }
    if (!validateRuc(value)) { rucError.value = 'RUC inválido'; return false; }
    rucError.value = '';
    return true;
  }

  return { cedulaError, rucError, checkCedula, checkRuc };
}
