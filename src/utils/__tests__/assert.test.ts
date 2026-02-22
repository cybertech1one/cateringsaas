import { describe, expect, it } from "vitest";
import { assert } from "../assert";

/**
 * Tests for the assert utility function.
 * Validates that it passes on truthy conditions and throws
 * ValidationError on falsy conditions.
 */

describe("assert", () => {
  it("should not throw when condition is true", () => {
    expect(() => assert(true, "should not throw")).not.toThrow();
  });

  it("should throw when condition is false", () => {
    expect(() => assert(false, "expected failure")).toThrow("expected failure");
  });

  it("should throw a ValidationError with the correct name", () => {
    try {
      assert(false, "test error");
      // Should not reach here
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("ValidationError");
    }
  });

  it("should include the actual value on the error object", () => {
    try {
      assert(false, "value check");
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect((error as { actualValue: unknown }).actualValue).toBe(false);
    }
  });

  it("should include the message on the error", () => {
    const msg = "Custom validation message";

    try {
      assert(false, msg);
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe(msg);
    }
  });

  it("should pass with truthy expressions", () => {
    expect(() => assert(1 === 1, "equality check")).not.toThrow();
    expect(() => assert("hello".length > 0, "string check")).not.toThrow();
    expect(() => assert(Boolean(42), "truthy number")).not.toThrow();
  });

  it("should fail with falsy expressions", () => {
    const a: number = 1;
    const b: number = 2;

    expect(() => assert(a === b, "inequality")).toThrow("inequality");
    expect(() => assert("".length > 0, "empty string")).toThrow("empty string");
  });

  it("should have the error inherit from Error", () => {
    try {
      assert(false, "inheritance test");
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect(error instanceof Error).toBe(true);
    }
  });

  it("should handle empty string message", () => {
    try {
      assert(false, "");
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe("");
      expect((error as Error).name).toBe("ValidationError");
    }
  });

  it("should handle long messages", () => {
    const longMsg = "A".repeat(1000);

    try {
      assert(false, longMsg);
      expect.unreachable("assert should have thrown");
    } catch (error) {
      expect((error as Error).message).toBe(longMsg);
    }
  });
});
