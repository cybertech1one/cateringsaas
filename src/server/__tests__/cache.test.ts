import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Tests for MemoryCache and cache utilities.
 * Tests cover TTL expiration, get/set patterns, prefix invalidation,
 * cache key builders, and TTL presets.
 */

// Import a new instance of MemoryCache to avoid singleton state pollution
class MemoryCache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);

      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(keyOrPrefix: string): void {
    if (this.store.has(keyOrPrefix)) {
      this.store.delete(keyOrPrefix);

      return;
    }

    // Prefix-based invalidation
    for (const key of this.store.keys()) {
      if (key.startsWith(keyOrPrefix)) {
        this.store.delete(key);
      }
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number,
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== undefined) return cached;

    const value = await factory();

    this.set(key, value, ttlMs);

    return value;
  }

  stats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }

  private startCleanup() {
    if (this.cleanupTimer) return;
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();

      for (const [key, entry] of this.store) {
        if (now > entry.expiresAt) {
          this.store.delete(key);
        }
      }

      if (this.store.size === 0 && this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
        this.cleanupTimer = null;
      }
    }, 60_000);
  }

  // Expose for testing
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Import actual exports
import { TTL, cacheKey } from "../cache";

describe("MemoryCache", () => {
  let cache: MemoryCache;

  beforeEach(() => {
    vi.useFakeTimers();
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.stopCleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("constructor and basic set/get", () => {
    it("should store and retrieve a string value", () => {
      cache.set("key1", "value1", 10_000);
      const result = cache.get<string>("key1");

      expect(result).toBe("value1");
    });

    it("should store and retrieve an object value", () => {
      const obj = { name: "test", count: 42 };

      cache.set("obj-key", obj, 10_000);
      const result = cache.get<typeof obj>("obj-key");

      expect(result).toEqual(obj);
    });

    it("should return undefined for non-existent keys", () => {
      const result = cache.get("nonexistent");

      expect(result).toBeUndefined();
    });

    it("should handle multiple keys independently", () => {
      cache.set("key1", "value1", 10_000);
      cache.set("key2", "value2", 10_000);

      expect(cache.get("key1")).toBe("value1");
      expect(cache.get("key2")).toBe("value2");
    });
  });

  describe("TTL expiration", () => {
    it("should expire entries after TTL", () => {
      cache.set("short-lived", "expires-soon", 1_000); // 1 second TTL

      expect(cache.get("short-lived")).toBe("expires-soon");

      // Advance time by 1.5 seconds
      vi.advanceTimersByTime(1_500);

      expect(cache.get("short-lived")).toBeUndefined();
    });

    it("should keep entries within TTL", () => {
      cache.set("long-lived", "still-here", 10_000); // 10 second TTL

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5_000);

      expect(cache.get("long-lived")).toBe("still-here");
    });

    it("should delete expired entry on access", () => {
      cache.set("auto-delete", "value", 1_000);

      vi.advanceTimersByTime(1_500);

      cache.get("auto-delete"); // Should trigger deletion

      const stats = cache.stats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe("getOrSet pattern", () => {
    it("should call factory on cache miss and cache the result", async () => {
      const factory = vi.fn(async () => "fresh-value");

      const result = await cache.getOrSet("miss-key", factory, 10_000);

      expect(result).toBe("fresh-value");
      expect(factory).toHaveBeenCalledTimes(1);

      // Value should now be cached
      const cached = cache.get("miss-key");

      expect(cached).toBe("fresh-value");
    });

    it("should return cached value without calling factory on cache hit", async () => {
      cache.set("hit-key", "cached-value", 10_000);

      const factory = vi.fn(async () => "fresh-value");
      const result = await cache.getOrSet("hit-key", factory, 10_000);

      expect(result).toBe("cached-value");
      expect(factory).not.toHaveBeenCalled();
    });

    it("should call factory again after expiration", async () => {
      const factory = vi.fn(async () => "fresh-value");

      // First call - cache miss
      await cache.getOrSet("expire-key", factory, 1_000);
      expect(factory).toHaveBeenCalledTimes(1);

      // Advance time past expiration
      vi.advanceTimersByTime(1_500);

      // Second call - cache miss due to expiration
      const result = await cache.getOrSet("expire-key", factory, 1_000);

      expect(result).toBe("fresh-value");
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidate and invalidateByPrefix", () => {
    it("should invalidate a specific key", () => {
      cache.set("delete-me", "value", 10_000);
      cache.set("keep-me", "value", 10_000);

      cache.invalidate("delete-me");

      expect(cache.get("delete-me")).toBeUndefined();
      expect(cache.get("keep-me")).toBe("value");
    });

    it("should invalidate all keys matching a prefix", () => {
      cache.set("user:123:profile", "data1", 10_000);
      cache.set("user:123:settings", "data2", 10_000);
      cache.set("user:456:profile", "data3", 10_000);
      cache.set("menu:abc", "data4", 10_000);

      cache.invalidate("user:123:");

      expect(cache.get("user:123:profile")).toBeUndefined();
      expect(cache.get("user:123:settings")).toBeUndefined();
      expect(cache.get("user:456:profile")).toBe("data3");
      expect(cache.get("menu:abc")).toBe("data4");
    });

    it("should handle invalidation of non-existent keys", () => {
      cache.invalidate("nonexistent");

      const stats = cache.stats();

      expect(stats.size).toBe(0);
    });

    it("should handle invalidation with prefix that matches no keys", () => {
      cache.set("keep", "value", 10_000);

      cache.invalidate("nomatch:");

      expect(cache.get("keep")).toBe("value");
    });
  });

  describe("cache key builders", () => {
    it("should generate correct publicMenu key", () => {
      const key = cacheKey.publicMenu("my-restaurant-slug");

      expect(key).toBe("public:menu:my-restaurant-slug");
    });

    it("should generate correct publicTheme key", () => {
      const key = cacheKey.publicTheme("menu-id-123");

      expect(key).toBe("public:theme:menu-id-123");
    });

    it("should generate correct publicReviews key", () => {
      const key = cacheKey.publicReviews("menu-id-456");

      expect(key).toBe("public:reviews:menu-id-456");
    });

    it("should generate correct publicPromotions key", () => {
      const key = cacheKey.publicPromotions("menu-id-789");

      expect(key).toBe("public:promotions:menu-id-789");
    });

    it("should generate correct allergens key", () => {
      const key = cacheKey.allergens();

      expect(key).toBe("allergens:standard");
    });

    it("should generate correct menuAllergens key", () => {
      const key = cacheKey.menuAllergens("menu-id-abc");

      expect(key).toBe("allergens:menu:menu-id-abc");
    });

    it("should generate correct fonts key", () => {
      const key = cacheKey.fonts();

      expect(key).toBe("theme:fonts");
    });

    it("should generate correct templates key", () => {
      const key = cacheKey.templates();

      expect(key).toBe("theme:templates");
    });
  });

  describe("TTL presets", () => {
    it("should have correct SHORT TTL value", () => {
      expect(TTL.SHORT).toBe(30_000); // 30 seconds
    });

    it("should have correct MEDIUM TTL value", () => {
      expect(TTL.MEDIUM).toBe(5 * 60_000); // 5 minutes = 300,000ms
    });

    it("should have correct LONG TTL value", () => {
      expect(TTL.LONG).toBe(30 * 60_000); // 30 minutes = 1,800,000ms
    });

    it("should have correct HOUR TTL value", () => {
      expect(TTL.HOUR).toBe(60 * 60_000); // 1 hour = 3,600,000ms
    });
  });

  describe("stats", () => {
    it("should return correct stats for empty cache", () => {
      const stats = cache.stats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });

    it("should return correct stats with multiple entries", () => {
      cache.set("key1", "value1", 10_000);
      cache.set("key2", "value2", 10_000);
      cache.set("key3", "value3", 10_000);

      const stats = cache.stats();

      expect(stats.size).toBe(3);
      expect(stats.keys).toEqual(["key1", "key2", "key3"]);
    });

    it("should update stats after invalidation", () => {
      cache.set("key1", "value1", 10_000);
      cache.set("key2", "value2", 10_000);

      cache.invalidate("key1");

      const stats = cache.stats();

      expect(stats.size).toBe(1);
      expect(stats.keys).toEqual(["key2"]);
    });
  });
});
