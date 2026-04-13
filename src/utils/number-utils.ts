/**
 * Convierte un valor a número de forma segura
 * @param value Valor a convertir (puede ser número, string, null, undefined)
 * @param defaultValue Valor por defecto si la conversión falla (default: 0)
 * @returns Número convertido o valor por defecto
 */
export function toNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') return defaultValue;
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
}

/**
 * Formatea un número a string con decimales de forma segura
 * @param value Valor a formatear
 * @param decimals Cantidad de decimales (default: 2)
 * @returns String formateado o "0.00" si es inválido
 */
export function formatNumber(value: any, decimals: number = 2): string {
  const num = toNumber(value);
  return num.toFixed(decimals);
}

/**
 * Convierte múltiples propiedades de un objeto a números
 * @param obj Objeto con valores potencialmente string
 * @param keys Array de llaves a convertir
 * @returns Nuevo objeto con valores convertidos a número
 */
export function formatCurrency(value: any): string {
  return '$' + formatNumber(value, 2);
}

export function ensureNumbers<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): T {
  const result = { ...obj };
  keys.forEach(key => {
    if (key in result) {
      (result[key] as any) = toNumber(result[key]);
    }
  });
  return result;
}
