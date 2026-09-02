import { compareSync, hashSync } from "bcryptjs";

const BCRYPT_WORK_FACTOR = 10;
const MAX_PASSWORD_BYTES = 128;

const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

export function validatePasswordStrength(
  plaintext: string,
): { valid: boolean; error?: string } {
  if (!plaintext || typeof plaintext !== "string") {
    return { valid: false, error: "Password is required." };
  }
  const byteCount = new TextEncoder().encode(plaintext).length;
  if (byteCount < 8) {
    return {
      valid: false,
      error: "Use a password at least 8 characters long.",
    };
  }
  if (byteCount > MAX_PASSWORD_BYTES) {
    return {
      valid: false,
      error: `Password must be ${MAX_PASSWORD_BYTES} characters or fewer.`,
    };
  }
  const classes = [
    HAS_UPPERCASE.test(plaintext) ? 1 : 0,
    HAS_LOWERCASE.test(plaintext) ? 1 : 0,
    HAS_DIGIT.test(plaintext) ? 1 : 0,
    HAS_SYMBOL.test(plaintext) ? 1 : 0,
  ].reduce((sum, n) => sum + n, 0);
  if (classes < 2) {
    return {
      valid: false,
      error:
        "Use a password with at least two different character types: uppercase letters, lowercase letters, numbers, or symbols.",
    };
  }
  return { valid: true };
}

export async function hashPassword(plaintext: string): Promise<string> {
  const strength = validatePasswordStrength(plaintext);
  if (!strength.valid) {
    throw new Error(strength.error ?? "Invalid password.");
  }
  await new Promise<void>((resolve) => setImmediate(resolve));
  const hashed = hashSync(plaintext, BCRYPT_WORK_FACTOR);
  if (!hashed || typeof hashed !== "string" || hashed.length < 50) {
    throw new Error("Password hashing failed.");
  }
  return hashed;
}

export async function verifyPassword(
  plaintext: string | null | undefined,
  storedHash: string | null | undefined,
): Promise<boolean> {
  await new Promise<void>((resolve) => setImmediate(resolve));
  if (!plaintext || typeof plaintext !== "string") return false;
  if (!storedHash || typeof storedHash !== "string") {
    try {
      compareSync(
        "dummy-empty-hash-check",
        "$2b$10$CwTycUXWue0Thq9StjUM0uJ8b7mzH.0VZ0XQ.GgKpHKbRXMlL8YHa",
      );
    } catch {
      /* constant-time dummy compare for null-hash accounts */
    }
    return false;
  }
  try {
    return Boolean(compareSync(plaintext, storedHash));
  } catch {
    return false;
  }
}
