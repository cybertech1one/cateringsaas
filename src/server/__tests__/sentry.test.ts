import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock fetch globally before importing module
const mockFetch = vi.fn().mockResolvedValue({ ok: true });

vi.stubGlobal("fetch", mockFetch);

// Mock crypto.randomUUID
vi.stubGlobal("crypto", {
  randomUUID: () => "12345678-1234-1234-1234-123456789abc",
});

describe("sentry", () => {
  const VALID_DSN = "https://abc123@o123456.ingest.sentry.io/456789";
  const EXPECTED_ENDPOINT =
    "https://o123456.ingest.sentry.io/api/456789/store/?sentry_key=abc123&sentry_version=7";

  beforeEach(() => {
    mockFetch.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  describe("isSentryEnabled", () => {
    it("should return false when SENTRY_DSN is not set", async () => {
      vi.stubEnv("SENTRY_DSN", "");
      const { isSentryEnabled } = await import("../sentry");

      expect(isSentryEnabled()).toBe(false);
    });

    it("should return true when SENTRY_DSN is a valid DSN", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { isSentryEnabled } = await import("../sentry");

      expect(isSentryEnabled()).toBe(true);
    });

    it("should return false when SENTRY_DSN is an invalid URL", async () => {
      vi.stubEnv("SENTRY_DSN", "not-a-url");
      const { isSentryEnabled } = await import("../sentry");

      expect(isSentryEnabled()).toBe(false);
    });
  });

  describe("captureException", () => {
    it("should not call fetch when SENTRY_DSN is empty", async () => {
      vi.stubEnv("SENTRY_DSN", "");
      const { captureException } = await import("../sentry");

      await captureException(new Error("test"));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should POST error event to Sentry envelope endpoint", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureException } = await import("../sentry");

      const error = new TypeError("Cannot read property 'x' of undefined");

      await captureException(error, { userId: "u123" });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0]!;

      expect(url).toBe(EXPECTED_ENDPOINT);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body as string);

      expect(body.event_id).toBe("12345678123412341234123456789abc");
      expect(body.timestamp).toBe("2024-06-15T12:00:00.000Z");
      expect(body.platform).toBe("node");
      expect(body.level).toBe("error");
      expect(body.server_name).toBe("feastqr");
      expect(body.exception.values[0].type).toBe("TypeError");
      expect(body.exception.values[0].value).toBe(
        "Cannot read property 'x' of undefined",
      );
      expect(body.extra).toEqual({ userId: "u123" });
    });

    it("should convert non-Error values to Error objects", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureException } = await import("../sentry");

      await captureException("string error");

      expect(mockFetch).toHaveBeenCalledOnce();
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.exception.values[0].type).toBe("Error");
      expect(body.exception.values[0].value).toBe("string error");
    });

    it("should include stack trace frames when available", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureException } = await import("../sentry");

      const error = new Error("with stack");

      await captureException(error);

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.exception.values[0].stacktrace).toBeDefined();
      expect(body.exception.values[0].stacktrace.frames.length).toBeGreaterThan(
        0,
      );
    });

    it("should silently fail when fetch throws", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const { captureException } = await import("../sentry");

      // Should not throw
      await expect(
        captureException(new Error("test")),
      ).resolves.toBeUndefined();
    });

    it("should include environment from NODE_ENV", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      vi.stubEnv("NODE_ENV", "production");
      const { captureException } = await import("../sentry");

      await captureException(new Error("prod error"));

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.environment).toBe("production");
    });
  });

  describe("captureMessage", () => {
    it("should not call fetch when SENTRY_DSN is empty", async () => {
      vi.stubEnv("SENTRY_DSN", "");
      const { captureMessage } = await import("../sentry");

      await captureMessage("hello");

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should POST message event with correct level", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureMessage } = await import("../sentry");

      await captureMessage("Deploy started", "info", { version: "1.2.3" });

      expect(mockFetch).toHaveBeenCalledOnce();
      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.level).toBe("info");
      expect(body.message).toEqual({ formatted: "Deploy started" });
      expect(body.extra).toEqual({ version: "1.2.3" });
      expect(body.server_name).toBe("feastqr");
    });

    it("should default to info level", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureMessage } = await import("../sentry");

      await captureMessage("test");

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.level).toBe("info");
    });

    it("should support warning level", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      const { captureMessage } = await import("../sentry");

      await captureMessage("slow query", "warning");

      const body = JSON.parse(mockFetch.mock.calls[0]![1].body as string);

      expect(body.level).toBe("warning");
    });

    it("should silently fail when fetch throws", async () => {
      vi.stubEnv("SENTRY_DSN", VALID_DSN);
      mockFetch.mockRejectedValueOnce(new Error("Timeout"));
      const { captureMessage } = await import("../sentry");

      await expect(
        captureMessage("test"),
      ).resolves.toBeUndefined();
    });
  });

  describe("DSN parsing", () => {
    it("should correctly parse a standard Sentry DSN", async () => {
      vi.stubEnv("SENTRY_DSN", "https://key123@o999.ingest.sentry.io/777");
      const { isSentryEnabled, captureMessage } = await import("../sentry");

      expect(isSentryEnabled()).toBe(true);

      await captureMessage("test");

      const url = mockFetch.mock.calls[0]![0] as string;

      expect(url).toBe(
        "https://o999.ingest.sentry.io/api/777/store/?sentry_key=key123&sentry_version=7",
      );
    });

    it("should handle self-hosted Sentry DSN", async () => {
      vi.stubEnv(
        "SENTRY_DSN",
        "https://mykey@sentry.mycompany.com/42",
      );
      const { isSentryEnabled, captureMessage } = await import("../sentry");

      expect(isSentryEnabled()).toBe(true);

      await captureMessage("test");

      const url = mockFetch.mock.calls[0]![0] as string;

      expect(url).toBe(
        "https://sentry.mycompany.com/api/42/store/?sentry_key=mykey&sentry_version=7",
      );
    });
  });
});
