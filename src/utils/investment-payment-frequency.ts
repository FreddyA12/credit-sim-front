export const PAYMENT_FREQUENCY_LABELS: Record<string, string> = {
  at_maturity: 'Al vencimiento',
  monthly: 'Mensual',
  bimonthly: 'Bimensual',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
};

export function paymentFrequencyLabel(freq: string | undefined | null): string {
  if (freq == null || freq === '') return '—';
  return PAYMENT_FREQUENCY_LABELS[freq] ?? freq;
}

/** Días por período (misma convención que el backend). */
export function daysStepForPaymentFrequency(freq: string | undefined | null): number | null {
  switch (freq) {
    case 'monthly':
      return 30;
    case 'bimonthly':
      return 60;
    case 'quarterly':
      return 90;
    case 'semiannual':
      return 180;
    default:
      return null;
  }
}
