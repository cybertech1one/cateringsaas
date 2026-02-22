import { describe, expect, it } from "vitest";
import { rateLimit } from "../rateLimit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const key = `test-allow-${Date.now()}`;
    const result = rateLimit({ key, limit: 5, windowMs: 10_000 });

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks requests exceeding limit", () => {
    const key = `test-block-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      rateLimit({ key, limit: 3, windowMs: 10_000 });
    }

    const result = rateLimit({ key, limit: 3, windowMs: 10_000 });

    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks remaining correctly", () => {
    const key = `test-remaining-${Date.now()}`;
    const r1 = rateLimit({ key, limit: 5, windowMs: 10_000 });

    expect(r1.remaining).toBe(4);

    const r2 = rateLimit({ key, limit: 5, windowMs: 10_000 });

    expect(r2.remaining).toBe(3);

    const r3 = rateLimit({ key, limit: 5, windowMs: 10_000 });

    expect(r3.remaining).toBe(2);
  });

  it("uses separate limits per key", () => {
    const keyA = `test-separate-a-${Date.now()}`;
    const keyB = `test-separate-b-${Date.now()}`;

    for (let i = 0; i < 3; i++) {
      rateLimit({ key: keyA, limit: 3, windowMs: 10_000 });
    }

    const resultA = rateLimit({ key: keyA, limit: 3, windowMs: 10_000 });

    expect(resultA.success).toBe(false);

    const resultB = rateLimit({ key: keyB, limit: 3, windowMs: 10_000 });

    expect(resultB.success).toBe(true);
  });
});
