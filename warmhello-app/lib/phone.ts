const NANP_PATTERN = /^[2-9]\d{2}[2-9]\d{6}$/;

export function normalizePhone(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  if (value.length === 0) return null;

  const digits = value.replace(/\D/g, "");

  if (value.startsWith("+")) {
    return digits.length > 0 ? "+" + digits : null;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return NANP_PATTERN.test(digits.slice(1)) ? "+" + digits : null;
  }

  if (digits.length === 10) {
    return NANP_PATTERN.test(digits) ? "+1" + digits : null;
  }

  return null;
}
