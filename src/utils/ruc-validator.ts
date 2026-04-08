export function validateRuc(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false;
  if (!ruc.endsWith('001')) return false;
  const province = parseInt(ruc.substring(0, 2));
  if (province < 1 || province > 24) return false;
  const thirdDigit = parseInt(ruc[2]);
  if (thirdDigit < 6) {
    return validateNaturalPersonRuc(ruc);
  } else if (thirdDigit === 6) {
    return validatePublicRuc(ruc);
  } else if (thirdDigit === 9) {
    return validateLegalPersonRuc(ruc);
  }
  return false;
}

function validateNaturalPersonRuc(ruc: string): boolean {
  const digits = ruc.substring(0, 10).split('').map(Number);
  const verifier = digits[9];
  const factors = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let val = digits[i] * factors[i];
    if (val > 9) val -= 9;
    sum += val;
  }
  const mod = sum % 10;
  const expected = mod === 0 ? 0 : 10 - mod;
  return verifier === expected;
}

function validatePublicRuc(ruc: string): boolean {
  const digits = ruc.substring(0, 9).split('').map(Number);
  const verifier = digits[8];
  const factors = [3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += digits[i] * factors[i];
  const mod = sum % 11;
  const expected = mod === 0 ? 0 : 11 - mod;
  return verifier === expected;
}

function validateLegalPersonRuc(ruc: string): boolean {
  const digits = ruc.substring(0, 10).split('').map(Number);
  const verifier = digits[9];
  const factors = [4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * factors[i];
  const mod = sum % 11;
  const expected = mod === 0 ? 0 : 11 - mod;
  return verifier === expected;
}
