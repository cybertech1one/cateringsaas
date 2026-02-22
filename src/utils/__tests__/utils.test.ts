import { describe, expect, it } from "vitest";
import { z } from "zod";
import { asOptionalField, notEmpty } from "../utils";

/**
 * Tests for general utility functions.
 * Covers asOptionalField (Zod schema helper) and notEmpty (type guard).
 */

describe("asOptionalField", () => {
  it("should accept undefined for an optional string field", () => {
    const schema = asOptionalField(z.string());
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
  });

  it("should accept empty string for an optional string field", () => {
    const schema = asOptionalField(z.string());
    const result = schema.safeParse("");

    expect(result.success).toBe(true);
  });

  it("should accept a valid string value", () => {
    const schema = asOptionalField(z.string());
    const result = schema.safeParse("hello");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("hello");
    }
  });

  it("should accept undefined for an optional number field", () => {
    const schema = asOptionalField(z.number());
    const result = schema.safeParse(undefined);

    expect(result.success).toBe(true);
  });

  it("should accept a valid number value", () => {
    const schema = asOptionalField(z.number());
    const result = schema.safeParse(42);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(42);
    }
  });

  it("should accept empty string even for optional number (due to .or(z.literal('')))", () => {
    const schema = asOptionalField(z.number());
    const result = schema.safeParse("");

    expect(result.success).toBe(true);
  });

  it("should reject invalid types that don't match original or empty string", () => {
    const schema = asOptionalField(z.string().email());
    const result = schema.safeParse("not-an-email");

    // "not-an-email" is not a valid email AND is not the literal ""
    // But it IS a string, so the .optional() variant of z.string().email() will try to validate it
    // It should fail because it's not a valid email
    expect(result.success).toBe(false);
  });

  it("should accept valid email for email schema", () => {
    const schema = asOptionalField(z.string().email());
    const result = schema.safeParse("test@example.com");

    expect(result.success).toBe(true);
  });

  it("should work with z.string().min() schema", () => {
    const schema = asOptionalField(z.string().min(3));

    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("ab").success).toBe(false);
    expect(schema.safeParse("abc").success).toBe(true);
  });
});

describe("notEmpty", () => {
  it("should return true for a non-null, non-undefined value", () => {
    expect(notEmpty("hello")).toBe(true);
    expect(notEmpty(42)).toBe(true);
    expect(notEmpty(0)).toBe(true);
    expect(notEmpty(false)).toBe(true);
    expect(notEmpty("")).toBe(true);
  });

  it("should return false for null", () => {
    expect(notEmpty(null)).toBe(false);
  });

  it("should return false for undefined", () => {
    expect(notEmpty(undefined)).toBe(false);
  });

  it("should return true for an empty object", () => {
    expect(notEmpty({})).toBe(true);
  });

  it("should return true for an empty array", () => {
    expect(notEmpty([])).toBe(true);
  });

  it("should return true for zero", () => {
    expect(notEmpty(0)).toBe(true);
  });

  it("should return true for false (boolean)", () => {
    expect(notEmpty(false)).toBe(true);
  });

  it("should return true for empty string", () => {
    expect(notEmpty("")).toBe(true);
  });

  it("should work as a filter predicate to remove nulls and undefineds", () => {
    const input = [1, null, 2, undefined, 3, null];
    const filtered = input.filter(notEmpty);

    expect(filtered).toEqual([1, 2, 3]);
    expect(filtered).toHaveLength(3);
  });

  it("should work as filter predicate with string arrays", () => {
    const input: (string | null | undefined)[] = [
      "a",
      null,
      "b",
      undefined,
      "c",
    ];
    const filtered = input.filter(notEmpty);

    expect(filtered).toEqual(["a", "b", "c"]);
  });

  it("should return true for NaN (it is not null or undefined)", () => {
    expect(notEmpty(NaN)).toBe(true);
  });
});
