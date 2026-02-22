import { describe, expect, it } from "vitest";
import { shimmerToBase64 } from "~/utils/shimmer";

/**
 * Tests for the shimmer utility that produces SVG data URIs
 * used as blur placeholders for Next.js Image components.
 */

describe("shimmerToBase64", () => {
  // ── Format validation ───────────────────────────────────────

  it("should return a valid data URI with the correct prefix", () => {
    const result = shimmerToBase64(400, 300);

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it("should return a base64-decodable string after the prefix", () => {
    const result = shimmerToBase64(100, 100);
    const base64Part = result.replace("data:image/svg+xml;base64,", "");

    // Buffer.from with base64 should not throw
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

    expect(decoded.length).toBeGreaterThan(0);
  });

  // ── SVG content validation ──────────────────────────────────

  it("should produce valid SVG markup containing the specified width", () => {
    const result = shimmerToBase64(640, 480);
    const base64Part = result.replace("data:image/svg+xml;base64,", "");
    const svg = Buffer.from(base64Part, "base64").toString("utf-8");

    expect(svg).toContain('width="640"');
    expect(svg).toContain('height="480"');
  });

  it("should contain an SVG root element", () => {
    const result = shimmerToBase64(10, 10);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("should contain a linearGradient definition for the shimmer effect", () => {
    const result = shimmerToBase64(200, 100);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain("linearGradient");
    expect(svg).toContain('id="g"');
  });

  it("should contain an animate element for the shimmer animation", () => {
    const result = shimmerToBase64(200, 100);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain("<animate");
    expect(svg).toContain("repeatCount");
  });

  it("should contain two rect elements (background and animated)", () => {
    const result = shimmerToBase64(50, 50);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    const rectMatches = svg.match(/<rect /g);

    expect(rectMatches).not.toBeNull();
    expect(rectMatches!.length).toBe(2);
  });

  // ── Different dimensions ────────────────────────────────────

  it("should generate different output for different dimensions", () => {
    const a = shimmerToBase64(100, 100);
    const b = shimmerToBase64(200, 200);

    expect(a).not.toBe(b);
  });

  it("should handle very small dimensions (1x1)", () => {
    const result = shimmerToBase64(1, 1);

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain('width="1"');
    expect(svg).toContain('height="1"');
  });

  it("should handle large dimensions (4000x3000)", () => {
    const result = shimmerToBase64(4000, 3000);

    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);

    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain('width="4000"');
    expect(svg).toContain('height="3000"');
  });

  it("should produce a non-square SVG with different width and height", () => {
    const result = shimmerToBase64(800, 600);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain('width="800"');
    expect(svg).toContain('height="600"');
  });

  // ── Animation details ───────────────────────────────────────

  it("should animate from negative width to positive width", () => {
    const w = 300;
    const result = shimmerToBase64(w, 200);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain(`from="-${w}"`);
    expect(svg).toContain(`to="${w}"`);
  });

  it("should use 1.5s animation duration", () => {
    const result = shimmerToBase64(100, 100);
    const svg = Buffer.from(
      result.replace("data:image/svg+xml;base64,", ""),
      "base64",
    ).toString("utf-8");

    expect(svg).toContain('dur="1.5s"');
  });

  // ── Determinism ─────────────────────────────────────────────

  it("should produce identical output for the same inputs", () => {
    const a = shimmerToBase64(256, 128);
    const b = shimmerToBase64(256, 128);

    expect(a).toBe(b);
  });
});
