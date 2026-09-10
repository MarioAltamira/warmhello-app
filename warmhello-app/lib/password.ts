import { compare, hash } from "bcryptjs";

const BCRYPT_WORK_FACTOR = 12;
const MIN_PASSWORD_BYTES = 12;
const MAX_PASSWORD_BYTES = 128;
const MIN_PASSWORD_CLASSES = 3;

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
  if (byteCount < MIN_PASSWORD_BYTES) {
    return {
      valid: false,
      error: `Use a password at least ${MIN_PASSWORD_BYTES} characters long.`,
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
  if (classes < MIN_PASSWORD_CLASSES) {
    return {
      valid: false,
      error:
        "Use a password with at least three different character types: uppercase letters, lowercase letters, numbers, or symbols.",
    };
  }
  return { valid: true };
}

export async function hashPassword(plaintext: string): Promise<string> {
  const strength = validatePasswordStrength(plaintext);
  if (!strength.valid) {
    throw new Error(strength.error ?? "Invalid password.");
  }
  const hashed = await hash(plaintext, BCRYPT_WORK_FACTOR);
  if (!hashed || typeof hashed !== "string" || hashed.length < 50) {
    throw new Error("Password hashing failed.");
  }
  return hashed;
}

export async function verifyPassword(
  plaintext: string | null | undefined,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!plaintext || typeof plaintext !== "string") return false;
  if (!storedHash || typeof storedHash !== "string") {
    try {
      // Dummy hash must use the same cost factor as real hashes
      // (BCRYPT_WORK_FACTOR) so the "no such account" path takes the same
      // amount of time as the "wrong password" path, closing the timing oracle.
      await compare(
        "dummy-empty-hash-check",
        "$2b$12$kvVYqneVI1NIwsqx9THon.1kRy0uWsmVSitGgVjhHjGXcXiYpsFC.",
      );
    } catch {
      /* constant-time dummy compare for null-hash accounts */
    }
    return false;
  }
  try {
    return Boolean(await compare(plaintext, storedHash));
  } catch {
    return false;
  }
}
