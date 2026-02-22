import { describe, expect, it } from "vitest";
import { SUPPORTED_IMAGE_FORMATS, MAX_IMAGE_SIZE } from "../images";

/**
 * Tests for image validation constants.
 * Validates the supported formats set and max file size limit.
 */

describe("SUPPORTED_IMAGE_FORMATS", () => {
  it("should be a Set", () => {
    expect(SUPPORTED_IMAGE_FORMATS).toBeInstanceOf(Set);
  });

  it("should contain image/jpeg", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/jpeg")).toBe(true);
  });

  it("should contain image/jpg", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/jpg")).toBe(true);
  });

  it("should contain image/png", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/png")).toBe(true);
  });

  it("should not contain image/gif", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/gif")).toBe(false);
  });

  it("should not contain image/webp", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/webp")).toBe(false);
  });

  it("should not contain image/svg+xml", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/svg+xml")).toBe(false);
  });

  it("should not contain image/bmp", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("image/bmp")).toBe(false);
  });

  it("should contain exactly 3 formats", () => {
    expect(SUPPORTED_IMAGE_FORMATS.size).toBe(3);
  });

  it("should be case-sensitive (uppercase not accepted)", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("IMAGE/JPEG")).toBe(false);
    expect(SUPPORTED_IMAGE_FORMATS.has("Image/Png")).toBe(false);
  });

  it("should not contain empty string", () => {
    expect(SUPPORTED_IMAGE_FORMATS.has("")).toBe(false);
  });
});

describe("MAX_IMAGE_SIZE", () => {
  it("should be exactly 5 MB in bytes", () => {
    expect(MAX_IMAGE_SIZE).toBe(5 * 1024 * 1024);
  });

  it("should equal 5242880 bytes", () => {
    expect(MAX_IMAGE_SIZE).toBe(5242880);
  });

  it("should be a positive number", () => {
    expect(MAX_IMAGE_SIZE).toBeGreaterThan(0);
  });

  it("should be greater than 1 MB", () => {
    expect(MAX_IMAGE_SIZE).toBeGreaterThan(1024 * 1024);
  });

  it("should be less than 10 MB", () => {
    expect(MAX_IMAGE_SIZE).toBeLessThan(10 * 1024 * 1024);
  });
});
