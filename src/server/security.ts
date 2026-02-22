import { createHash } from "crypto";

/**
 * Security utilities for the application
 */

/**
 * Hash an IP address for privacy-preserving analytics.
 * Uses SHA-256 with a daily salt so hashes rotate daily.
 */
export function hashIP(ip: string): string {
  const daySalt = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  return createHash("sha256")
    .update(`${ip}:${daySalt}`)
    .digest("hex")
    .slice(0, 16);
}

/**
 * Sanitize a string to prevent XSS in stored data.
 * Strips HTML tags and trims whitespace.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

/**
 * Validate that a URL is safe (no javascript: or data: protocols).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Rate limit key generators for different contexts.
 */
export const rateLimitKey = {
  byUser: (userId: string, action: string) => `user:${userId}:${action}`,
  byIP: (ip: string, action: string) => `ip:${ip}:${action}`,
  bySession: (sessionId: string, action: string) =>
    `session:${sessionId}:${action}`,
};

/**
 * Security headers for Next.js middleware.
 */
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
} as const;

/**
 * Content Security Policy directives.
 */
export function buildCSP(): string {
  const directives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://flagsapi.com",
    "connect-src 'self' https://*.supabase.co http://127.0.0.1:34321 http://localhost:34321 https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}
