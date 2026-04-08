export const SEGMENTS_WITH_INSURANCE = [
  'hipotecario',
  'vivienda_interes_social',
  'vivienda_interes_publico',
  'inmobiliario',
];

export function requiresInsurance(segment: string): boolean {
  return SEGMENTS_WITH_INSURANCE.includes(segment);
}

export const COSEDE_LIMITS: Record<string, number> = {
  banco: 32000,
  mutualista: 32000,
  cooperativa: 11290,
  eps: 11290,
};

export const INSURANCE_LEGAL_NOTES = {
  desgravamen: 'Circular SB-IG-2024-0034-C, Cap. XXV JPRF, Art. 210 COMF — 0.0499% mensual sobre saldo.',
  incendio_terremoto: 'Art. 308 COMF, Art. 68 LGS — Prima mensual sobre saldo asegurado.',
  solca: 'COMF Disposición General 14ª — 0.5% sobre el monto desembolsado.',
  cosede: 'Art. 330 COMF — Cobertura garantizada hasta el límite COSEDE vigente.',
};
