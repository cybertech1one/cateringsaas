/**
 * AES-256-GCM encryption for sensitive data at rest (e.g., CRM API keys).
 *
 * Ciphertext format: `iv:tag:encrypted` (all hex-encoded).
 *   - iv:  16-byte random initialization vector (32 hex chars)
 *   - tag: 16-byte GCM authentication tag   (32 hex chars)
 *   - encrypted: the AES-256-GCM ciphertext  (variable length hex)
 *
 * In local development (no VERCEL/CI env), encrypt/decrypt are no-ops
 * and return the input unchanged. In production, CRM_ENCRYPTION_KEY is required.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

/** True when running on Vercel or in CI — encryption is mandatory. */
const isProduction = !!(process.env.VERCEL || process.env.CI);

// ---------------------------------------------------------------------------
// Key derivation
// ---------------------------------------------------------------------------

function getEncryptionKey(): Buffer {
  const key = process.env.CRM_ENCRYPTION_KEY;

  if (!key) {
    if (isProduction) {
      throw new Error(
        "CRM_ENCRYPTION_KEY must be set in production. Refusing to store unencrypted secrets.",
      );
    }

    throw new Error("CRM_ENCRYPTION_KEY environment variable is not set");
  }

  // Derive a 32-byte key via SHA-256 so any passphrase length works
  return crypto.createHash("sha256").update(key).digest();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns the ciphertext in `iv:tag:encrypted` hex format.
 *
 * In dev mode (empty CRM_ENCRYPTION_KEY), returns the plaintext unchanged.
 */
export function encrypt(plaintext: string): string {
  // Dev mode: skip encryption when no key is configured
  if (!isProduction && !process.env.CRM_ENCRYPTION_KEY) {
    return plaintext;
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");

  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string produced by `encrypt()`.
 *
 * In dev mode (empty CRM_ENCRYPTION_KEY), returns the ciphertext unchanged.
 */
export function decrypt(ciphertext: string): string {
  // Dev mode: skip decryption when no key is configured
  if (!isProduction && !process.env.CRM_ENCRYPTION_KEY) {
    return ciphertext;
  }

  const key = getEncryptionKey();
  const parts = ciphertext.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0]!, "hex");
  const tag = Buffer.from(parts[1]!, "hex");
  const encrypted = parts[2]!;

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");

  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Check whether a string looks like it was produced by `encrypt()`.
 * Matches the `iv:tag:encrypted` format where iv and tag are each 32 hex chars.
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(":");

  return (
    parts.length === 3 &&
    parts[0]!.length === 32 &&
    parts[1]!.length === 32 &&
    parts[2]!.length > 0
  );
}

/**
 * Backwards-compatible decrypt: if the value looks encrypted, decrypt it;
 * otherwise return it as-is (plaintext from before encryption was added).
 */
export function decryptIfEncrypted(value: string): string {
  if (isEncrypted(value)) {
    return decrypt(value);
  }

  return value;
}
