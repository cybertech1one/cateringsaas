import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBaseUrl } from "../getBaseUrl";

/**
 * Tests for the getBaseUrl utility.
 * Validates environment-specific URL resolution for SSR and dev contexts.
 */

describe("getBaseUrl", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Create a fresh copy of process.env for each test
    vi.stubGlobal("process", {
      ...process,
      env: { ...originalEnv },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should return VERCEL_URL with https when VERCEL_URL is set", () => {
    process.env.VERCEL_URL = "my-app.vercel.app";

    const result = getBaseUrl();

    expect(result).toBe("https://my-app.vercel.app");
  });

  it("should prepend https:// to VERCEL_URL", () => {
    process.env.VERCEL_URL = "test-deploy-abc.vercel.app";

    const result = getBaseUrl();

    expect(result).toMatch(/^https:\/\//);
  });

  it("should return localhost:3000 by default when no env vars are set", () => {
    delete process.env.VERCEL_URL;
    delete process.env.PORT;

    const result = getBaseUrl();

    expect(result).toBe("http://localhost:3000");
  });

  it("should use PORT env var when set and VERCEL_URL is not set", () => {
    delete process.env.VERCEL_URL;
    process.env.PORT = "4000";

    const result = getBaseUrl();

    expect(result).toBe("http://localhost:4000");
  });

  it("should prefer VERCEL_URL over PORT when both are set", () => {
    process.env.VERCEL_URL = "production.vercel.app";
    process.env.PORT = "5000";

    const result = getBaseUrl();

    expect(result).toBe("https://production.vercel.app");
  });

  it("should use http for localhost", () => {
    delete process.env.VERCEL_URL;
    delete process.env.PORT;

    const result = getBaseUrl();

    expect(result).toMatch(/^http:\/\/localhost/);
  });

  it("should return a string", () => {
    const result = getBaseUrl();

    expect(typeof result).toBe("string");
  });

  it("should not have trailing slash", () => {
    delete process.env.VERCEL_URL;
    delete process.env.PORT;

    const result = getBaseUrl();

    expect(result.endsWith("/")).toBe(false);
  });

  it("should handle VERCEL_URL with subdomain", () => {
    process.env.VERCEL_URL = "my-app-git-feature.vercel.app";

    const result = getBaseUrl();

    expect(result).toBe("https://my-app-git-feature.vercel.app");
  });

  it("should handle custom port numbers", () => {
    delete process.env.VERCEL_URL;
    process.env.PORT = "8080";

    const result = getBaseUrl();

    expect(result).toBe("http://localhost:8080");
  });
});
