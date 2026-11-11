/**
 * KID (kundeidentifikasjon) numbers for Norwegian invoices.
 *
 * A KID is a payment reference ending in a check digit computed with
 * MOD10 (Luhn) or MOD11, as agreed with the payee's bank. The bank also
 * fixes the length. Banks reject payments whose KID does not match the
 * account's KID agreement, so KID stays off until the user turns it on
 * with the settings from their bank.
 */

/** MOD10 (Luhn) check digit for a string of digits. */
function mod10(digits) {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

/**
 * MOD11 check digit with weights 2–7 from the right.
 * Remainder 0 gives 0; a check value of 10 is written as '-', which the
 * Norwegian KID standard allows.
 */
function mod11(digits) {
  let sum = 0;
  let weight = 2;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    sum += Number(digits[i]) * weight;
    weight = weight === 7 ? 2 : weight + 1;
  }
  const check = 11 - (sum % 11);
  if (check === 11) return '0';
  if (check === 10) return '-';
  return String(check);
}

/**
 * Builds a KID from an invoice number (non-digits are dropped).
 * `length` is the full KID length including the check digit; the base is
 * left-padded with zeros. Returns null when the number cannot fit.
 */
function makeKid(invoiceNumber, { algorithm = 'mod10', length = null } = {}) {
  let base = String(invoiceNumber ?? '').replace(/\D/g, '');
  if (!base) return null;
  if (length) {
    const baseLength = Number(length) - 1;
    if (base.length > baseLength) return null;
    base = base.padStart(baseLength, '0');
  }
  const check = algorithm === 'mod11' ? mod11(base) : mod10(base);
  return base + check;
}

/** True when `kid` ends in the right check digit for the algorithm. */
function isValidKid(kid, algorithm = 'mod10') {
  const value = String(kid ?? '');
  if (!/^\d+[\d-]$/.test(value) || value.length < 2 || value.length > 25) return false;
  const base = value.slice(0, -1);
  const check = value.slice(-1);
  return (algorithm === 'mod11' ? mod11(base) : mod10(base)) === check;
}

module.exports = { mod10, mod11, makeKid, isValidKid };
