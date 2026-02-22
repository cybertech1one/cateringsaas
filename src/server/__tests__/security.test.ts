import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCSP,
  hashIP,
  isSafeUrl,
  rateLimitKey,
  sanitizeString,
  securityHeaders,
} from "../security";

/**
 * Tests for security utilities.
 * Covers IP hashing with rotation, string sanitization, URL validation,
 * rate limit key generation, and CSP header building.
 */

describe("security utilities", () => {
  describe("hashIP", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should produce consistent hashes for the same IP on the same day", () => {
      const ip = "192.168.1.100";
      const hash1 = hashIP(ip);
      const hash2 = hashIP(ip);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different IPs", () => {
      const ip1 = "192.168.1.100";
      const ip2 = "192.168.1.101";

      const hash1 = hashIP(ip1);
      const hash2 = hashIP(ip2);

      expect(hash1).not.toBe(hash2);
    });

    it("should produce 16-character hex hash", () => {
      const ip = "10.0.0.1";
      const hash = hashIP(ip);

      expect(hash).toMatch(/^[0-9a-f]{16}$/);
      expect(hash.length).toBe(16);
    });

    it("should produce different hashes on different days", () => {
      const ip = "192.168.1.100";

      // Day 1
      vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
      const hash1 = hashIP(ip);

      // Day 2
      vi.setSystemTime(new Date("2024-01-16T10:00:00Z"));
      const hash2 = hashIP(ip);

      expect(hash1).not.toBe(hash2);
    });

    it("should handle IPv6 addresses", () => {
      const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const hash = hashIP(ipv6);

      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("sanitizeString", () => {
    it("should remove HTML tags", () => {
      const input = "<script>alert('xss')</script>Hello";
      const result = sanitizeString(input);

      // Tags removed, then quotes escaped
      expect(result).toBe("alert(&#x27;xss&#x27;)Hello");
    });

    it("should escape HTML entities", () => {
      const input = '<div>Test & "quotes" < > </div>';
      const result = sanitizeString(input);

      // Tags removed first: 'Test & "quotes" < > '
      // Then special chars escaped
      expect(result).toBe("Test &amp; &quot;quotes&quot;");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeString(input);

      expect(result).toBe("Hello World");
    });

    it("should handle single quotes", () => {
      const input = "It's a test";
      const result = sanitizeString(input);

      expect(result).toBe("It&#x27;s a test");
    });

    it("should handle multiple HTML tags", () => {
      const input = "<p><strong>Bold</strong> and <em>italic</em></p>";
      const result = sanitizeString(input);

      expect(result).toBe("Bold and italic");
    });

    it("should handle empty string", () => {
      const input = "";
      const result = sanitizeString(input);

      expect(result).toBe("");
    });

    it("should handle string with only whitespace", () => {
      const input = "   \n\t   ";
      const result = sanitizeString(input);

      expect(result).toBe("");
    });

    it("should escape all special characters together", () => {
      const input = '<>&"\' mixed';
      const result = sanitizeString(input);

      // Tags removed first (the <> is a tag): '&"\' mixed'
      // Then special chars escaped
      expect(result).toBe("&amp;&quot;&#x27; mixed");
    });
  });

  describe("isSafeUrl", () => {
    it("should accept valid HTTP URL", () => {
      const url = "http://example.com";
      const result = isSafeUrl(url);

      expect(result).toBe(true);
    });

    it("should accept valid HTTPS URL", () => {
      const url = "https://example.com/path?query=value";
      const result = isSafeUrl(url);

      expect(result).toBe(true);
    });

    it("should reject javascript: protocol", () => {
      const url = "javascript:alert('xss')";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });

    it("should reject data: protocol", () => {
      const url = "data:text/html,<script>alert('xss')</script>";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });

    it("should reject file: protocol", () => {
      const url = "file:///etc/passwd";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });

    it("should reject malformed URLs", () => {
      const url = "not a url";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });

    it("should reject empty string", () => {
      const url = "";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });

    it("should accept HTTPS URL with complex path and query", () => {
      const url = "https://api.example.com/v1/users?page=2&limit=10#section";
      const result = isSafeUrl(url);

      expect(result).toBe(true);
    });

    it("should reject ftp: protocol", () => {
      const url = "ftp://files.example.com";
      const result = isSafeUrl(url);

      expect(result).toBe(false);
    });
  });

  describe("rateLimitKey", () => {
    it("should generate correct key for user and action", () => {
      const key = rateLimitKey.byUser("user-123", "login");

      expect(key).toBe("user:user-123:login");
    });

    it("should generate correct key for IP and action", () => {
      const key = rateLimitKey.byIP("192.168.1.100", "api-call");

      expect(key).toBe("ip:192.168.1.100:api-call");
    });

    it("should generate correct key for session and action", () => {
      const key = rateLimitKey.bySession("session-xyz", "upload");

      expect(key).toBe("session:session-xyz:upload");
    });

    it("should handle different actions for same user", () => {
      const key1 = rateLimitKey.byUser("user-456", "create-menu");
      const key2 = rateLimitKey.byUser("user-456", "delete-menu");

      expect(key1).toBe("user:user-456:create-menu");
      expect(key2).toBe("user:user-456:delete-menu");
      expect(key1).not.toBe(key2);
    });

    it("should handle special characters in action names", () => {
      const key = rateLimitKey.byUser("user-789", "menu:update:publish");

      expect(key).toBe("user:user-789:menu:update:publish");
    });
  });

  describe("securityHeaders", () => {
    it("should have X-Content-Type-Options set to nosniff", () => {
      expect(securityHeaders["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("should have X-Frame-Options set to DENY", () => {
      expect(securityHeaders["X-Frame-Options"]).toBe("DENY");
    });

    it("should have X-XSS-Protection set correctly", () => {
      expect(securityHeaders["X-XSS-Protection"]).toBe("1; mode=block");
    });

    it("should have Referrer-Policy set correctly", () => {
      expect(securityHeaders["Referrer-Policy"]).toBe(
        "strict-origin-when-cross-origin",
      );
    });

    it("should have Permissions-Policy set correctly", () => {
      expect(securityHeaders["Permissions-Policy"]).toBe(
        "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      );
    });

    it("should have Strict-Transport-Security set correctly", () => {
      expect(securityHeaders["Strict-Transport-Security"]).toBe(
        "max-age=31536000; includeSubDomains",
      );
    });

    it("should contain all expected headers", () => {
      const expectedHeaders = [
        "X-Content-Type-Options",
        "X-Frame-Options",
        "X-XSS-Protection",
        "Referrer-Policy",
        "Permissions-Policy",
        "Strict-Transport-Security",
      ];

      for (const header of expectedHeaders) {
        expect(securityHeaders).toHaveProperty(header);
      }
    });
  });

  describe("buildCSP", () => {
    it("should return a non-empty string", () => {
      const csp = buildCSP();

      expect(csp).toBeTruthy();
      expect(typeof csp).toBe("string");
      expect(csp.length).toBeGreaterThan(0);
    });

    it("should contain default-src 'self'", () => {
      const csp = buildCSP();

      expect(csp).toContain("default-src 'self'");
    });

    it("should contain script-src directive", () => {
      const csp = buildCSP();

      expect(csp).toContain("script-src");
      expect(csp).toContain("'unsafe-inline'");
    });

    it("should contain style-src directive with Google Fonts", () => {
      const csp = buildCSP();

      expect(csp).toContain("style-src");
      expect(csp).toContain("https://fonts.googleapis.com");
    });

    it("should contain font-src directive", () => {
      const csp = buildCSP();

      expect(csp).toContain("font-src 'self' https://fonts.gstatic.com");
    });

    it("should contain img-src directive with various sources", () => {
      const csp = buildCSP();

      expect(csp).toContain("img-src 'self' data: blob:");
      expect(csp).toContain("https://*.supabase.co");
    });

    it("should contain connect-src directive with Supabase and AI providers", () => {
      const csp = buildCSP();

      expect(csp).toContain("connect-src");
      expect(csp).toContain("https://*.supabase.co");
      expect(csp).toContain("https://api.openai.com");
      expect(csp).toContain("https://api.anthropic.com");
      expect(csp).toContain("https://generativelanguage.googleapis.com");
    });

    it("should contain frame-ancestors directive", () => {
      const csp = buildCSP();

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should use semicolons to separate directives", () => {
      const csp = buildCSP();

      expect(csp).toContain("; ");
      const directiveCount = csp.split("; ").length;

      expect(directiveCount).toBeGreaterThan(5);
    });

    it("should be a valid CSP header format", () => {
      const csp = buildCSP();

      // Should not start or end with semicolon
      expect(csp).not.toMatch(/^;/);
      expect(csp).not.toMatch(/;$/);

      // Should have proper directive format
      const directives = csp.split("; ");

      for (const directive of directives) {
        expect(directive).toMatch(/^[a-z-]+ .+$/);
      }
    });
  });
});
