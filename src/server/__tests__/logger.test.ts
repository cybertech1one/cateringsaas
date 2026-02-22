import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "../logger";

describe("logger", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:30:00.000Z"));
  });

  afterEach(() => {
    errorSpy.mockClear();
    warnSpy.mockClear();
    vi.useRealTimers();
  });

  describe("logger.error", () => {
    it("should log to console.error with timestamp and level", () => {
      logger.error("Something went wrong");

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(errorSpy.mock.calls[0]![0]).toContain("[ERROR]");
      expect(errorSpy.mock.calls[0]![0]).toContain("Something went wrong");
      expect(errorSpy.mock.calls[0]![0]).toContain("2024-01-15T10:30:00.000Z");
    });

    it("should include context when provided", () => {
      logger.error("DB query failed", undefined, "payments");

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(errorSpy.mock.calls[0]![0]).toContain("[payments]");
    });

    it("should format Error objects", () => {
      const err = new TypeError("Cannot read property");

      logger.error("Operation failed", err, "menus");

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(errorSpy.mock.calls[0]![0]).toContain("[menus]");
      expect(errorSpy.mock.calls[0]![1]).toContain("TypeError: Cannot read property");
    });

    it("should format non-Error objects as strings", () => {
      logger.error("Unexpected value", "raw string error");

      expect(errorSpy).toHaveBeenCalledOnce();
      expect(errorSpy.mock.calls[0]![1]).toBe("raw string error");
    });

    it("should handle null and undefined errors", () => {
      logger.error("Null error", null);
      logger.error("Undefined error", undefined);

      // null is truthy for the error check, undefined is not
      expect(errorSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("logger.warn", () => {
    it("should log to console.warn with timestamp and level", () => {
      logger.warn("Deprecation notice");

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0]![0]).toContain("[WARN]");
      expect(warnSpy.mock.calls[0]![0]).toContain("Deprecation notice");
    });

    it("should include error details when provided", () => {
      const err = new Error("Storage cleanup failed");

      logger.warn("Non-critical failure", err, "storage");

      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0]![0]).toContain("[storage]");
      expect(warnSpy.mock.calls[0]![1]).toContain("Error: Storage cleanup failed");
    });
  });

  describe("logger.info", () => {
    it("should not log to console (info is silent by default)", () => {
      logger.info("Server started", "startup");

      // Info level doesn't output to console in current implementation
      expect(errorSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("output format", () => {
    it("should produce structured format: [timestamp] [LEVEL] [context] message", () => {
      logger.error("Test message", undefined, "test-ctx");

      const output = errorSpy.mock.calls[0]![0] as string;

      expect(output).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] \[test-ctx\] Test message$/,
      );
    });

    it("should omit context bracket when no context provided", () => {
      logger.error("No context");

      const output = errorSpy.mock.calls[0]![0] as string;

      expect(output).not.toContain("[]");
      expect(output).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] No context$/,
      );
    });
  });
});
