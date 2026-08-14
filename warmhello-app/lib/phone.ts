export function normalizePhone(raw: string | null | undefined): string {
  if (raw == null) return "";
  let value = String(raw).trim();
  if (value.length === 0) return "";

  const digits = value.replace(/\D/g, "");

  if (value.startsWith("+")) {
    return "+" + digits;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return "+" + digits;
  }

  if (digits.length === 10) {
    return "+1" + digits;
  }

  if (digits.length > 0) {
    return digits.length === 11 && digits.startsWith("1")
      ? "+" + digits
      : "+1" + digits.slice(0, 10);
  }

  return value;
}
