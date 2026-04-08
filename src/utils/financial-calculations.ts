export function calcPmt(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function calcTotalInterest(pmt: number, termMonths: number, principal: number): number {
  return pmt * termMonths - principal;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(value);
}

export function calcGrossInterest(principal: number, annualRate: number, termDays: number): number {
  return principal * (annualRate / 100) * (termDays / 365);
}

export function calcIrWithholding(grossInterest: number): number {
  return grossInterest * 0.02;
}

export function calcNetInterest(grossInterest: number): number {
  return grossInterest * 0.98;
}
