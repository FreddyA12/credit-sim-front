export function validateCedula(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const province = parseInt(cedula.substring(0, 2));
  if (province < 1 || province > 24) return false;
  const digits = cedula.split('').map(Number);
  const verifier = digits[9];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = digits[i] * (i % 2 === 0 ? 2 : 1);
    if (val > 9) val -= 9;
    sum += val;
  }
  const mod = sum % 10;
  const expected = mod === 0 ? 0 : 10 - mod;
  return verifier === expected;
}
