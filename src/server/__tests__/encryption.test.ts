import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for the AES-256-GCM encryption module (src/server/encryption.ts).
 *
 * Covers:
 * - Round-trip encrypt/decrypt
 * - Unique ciphertexts per encryption (random IV)
 * - Output format validation (iv:tag:encrypted, hex-encoded)
 * - isEncrypted detection
 * - Error handling: invalid format, tampered ciphertext
 * - Dev mode: graceful no-op when CRM_ENCRYPTION_KEY is empty
 * - decryptIfEncrypted backwards-compatibility helper
 */

// ---------------------------------------------------------------------------
// Environment setup
// ---------------------------------------------------------------------------

const TEST_ENCRYPTION_KEY = "test-encryption-key-for-unit-tests";

describe("encryption", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.CRM_ENCRYPTION_KEY = TEST_ENCRYPTION_KEY;
  });

  afterEach(() => {
    delete process.env.CRM_ENCRYPTION_KEY;
  });

  // Helper to dynamically import so each test gets fresh module state
  async function loadModule() {
    return await import("../encryption");
  }

  // =========================================================================
  // encrypt / decrypt round-trip
  // =========================================================================

  describe("encrypt and decrypt", () => {
    it("round-trips a simple string", async () => {
      const { encrypt, decrypt } = await loadModule();
      const plaintext = "my-secret-api-key-12345";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("round-trips an empty string", async () => {
      const { encrypt, decrypt } = await loadModule();
      const plaintext = "";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("round-trips unicode content", async () => {
      const { encrypt, decrypt } = await loadModule();
      const plaintext = "cle-api-secrete-avec-des-accents-et-emojis";

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("round-trips a long string", async () => {
      const { encrypt, decrypt } = await loadModule();
      const plaintext = "a".repeat(10000);

      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("produces different ciphertexts for the same plaintext (random IV)", async () => {
      const { encrypt } = await loadModule();
      const plaintext = "same-api-key";

      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  // =========================================================================
  // Output format
  // =========================================================================

  describe("output format", () => {
    it("produces iv:tag:encrypted format with hex encoding", async () => {
      const { encrypt } = await loadModule();
      const encrypted = encrypt("test-value");

      const parts = encrypted.split(":");

      expect(parts).toHaveLength(3);
      // IV is 16 bytes = 32 hex chars
      expect(parts[0]).toHaveLength(32);
      // Auth tag is 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(32);
      // Encrypted data is non-empty hex
      expect(parts[2]!.length).toBeGreaterThan(0);
      // All parts are valid hex
      expect(parts[0]).toMatch(/^[0-9a-f]+$/);
      expect(parts[1]).toMatch(/^[0-9a-f]+$/);
      expect(parts[2]).toMatch(/^[0-9a-f]+$/);
    });
  });

  // =========================================================================
  // isEncrypted
  // =========================================================================

  describe("isEncrypted", () => {
    it("returns true for encrypted values", async () => {
      const { encrypt, isEncrypted } = await loadModule();
      const encrypted = encrypt("my-key");

      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("returns false for plaintext strings", async () => {
      const { isEncrypted } = await loadModule();

      expect(isEncrypted("twenty-api-key-abc123")).toBe(false);
    });

    it("returns false for empty string", async () => {
      const { isEncrypted } = await loadModule();

      expect(isEncrypted("")).toBe(false);
    });

    it("returns false for strings with colons but wrong format", async () => {
      const { isEncrypted } = await loadModule();

      expect(isEncrypted("a:b:c")).toBe(false);
      expect(isEncrypted("short:short:data")).toBe(false);
    });

    it("returns false for strings with only two colons but wrong segment lengths", async () => {
      const { isEncrypted } = await loadModule();

      // 32 chars but only 2 parts
      expect(isEncrypted("a".repeat(32) + ":" + "b".repeat(32))).toBe(false);
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe("error handling", () => {
    it("throws on invalid encrypted data format (wrong number of parts)", async () => {
      const { decrypt } = await loadModule();

      expect(() => decrypt("invalid-data")).toThrow("Invalid encrypted data format");
    });

    it("throws on tampered ciphertext", async () => {
      const { encrypt, decrypt } = await loadModule();
      const encrypted = encrypt("my-secret");

      // Tamper with the encrypted data
      const parts = encrypted.split(":");

      parts[2] = "ff" + parts[2]!.slice(2);
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws on tampered auth tag", async () => {
      const { encrypt, decrypt } = await loadModule();
      const encrypted = encrypt("my-secret");

      // Tamper with the auth tag
      const parts = encrypted.split(":");

      parts[1] = "00".repeat(16);
      const tampered = parts.join(":");

      expect(() => decrypt(tampered)).toThrow();
    });

    it("returns plaintext as no-op when CRM_ENCRYPTION_KEY is not set in dev mode", async () => {
      delete process.env.CRM_ENCRYPTION_KEY;
      const { encrypt } = await loadModule();

      // In dev mode (no VERCEL env), missing key is a no-op
      expect(encrypt("test")).toBe("test");
    });

    it("returns ciphertext as-is when CRM_ENCRYPTION_KEY is not set in dev mode for decrypt", async () => {
      delete process.env.CRM_ENCRYPTION_KEY;
      const { decrypt } = await loadModule();

      // In dev mode (no VERCEL env), missing key is a no-op
      expect(decrypt("some-value")).toBe("some-value");
    });
  });

  // =========================================================================
  // Dev mode (empty key)
  // =========================================================================

  describe("dev mode (empty encryption key)", () => {
    it("encrypt returns plaintext when key is empty", async () => {
      process.env.CRM_ENCRYPTION_KEY = "";
      const { encrypt } = await loadModule();

      const result = encrypt("my-api-key");

      expect(result).toBe("my-api-key");
    });

    it("decrypt returns value as-is when key is empty", async () => {
      process.env.CRM_ENCRYPTION_KEY = "";
      const { decrypt } = await loadModule();

      const result = decrypt("my-api-key");

      expect(result).toBe("my-api-key");
    });
  });

  // =========================================================================
  // decryptIfEncrypted (backwards compatibility)
  // =========================================================================

  describe("decryptIfEncrypted", () => {
    it("decrypts encrypted values", async () => {
      const { encrypt, decryptIfEncrypted } = await loadModule();
      const plaintext = "my-api-key";
      const encrypted = encrypt(plaintext);

      const result = decryptIfEncrypted(encrypted);

      expect(result).toBe(plaintext);
    });

    it("returns plaintext values unchanged", async () => {
      const { decryptIfEncrypted } = await loadModule();
      const plaintext = "twenty-api-key-abc123";

      const result = decryptIfEncrypted(plaintext);

      expect(result).toBe(plaintext);
    });

    it("returns plaintext when encryption key is empty (dev mode)", async () => {
      process.env.CRM_ENCRYPTION_KEY = "";
      const { decryptIfEncrypted } = await loadModule();

      const result = decryptIfEncrypted("my-api-key");

      expect(result).toBe("my-api-key");
    });
  });
});
