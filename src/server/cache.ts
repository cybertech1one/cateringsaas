/**
 * Simple in-memory cache with TTL support.
 * Used for caching public menu data, theme data, and other
 * frequently accessed read-only data.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Get a cached value. Returns undefined if not found or expired.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);

      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set a cached value with TTL in milliseconds.
   */
  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate a specific key or keys matching a prefix.
   */
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

  /**
   * Get or set pattern - fetches from cache if available,
   * otherwise calls the factory function and caches the result.
   */
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

  /**
   * Get cache statistics
   */
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
    }, 60_000); // Cleanup every minute
  }
}

// Singleton instance
export const cache = new MemoryCache();

/**
 * Cache key builders for consistent key generation
 */
export const cacheKey = {
  publicMenu: (slug: string) => `public:menu:${slug}`,
  publicTheme: (menuId: string) => `public:theme:${menuId}`,
  publicReviews: (menuId: string) => `public:reviews:${menuId}`,
  publicPromotions: (menuId: string) => `public:promotions:${menuId}`,
  allergens: () => `allergens:standard`,
  menuAllergens: (menuId: string) => `allergens:menu:${menuId}`,
  fonts: () => `theme:fonts`,
  templates: () => `theme:templates`,
} as const;

/**
 * TTL presets in milliseconds
 */
export const TTL = {
  SHORT: 30_000, // 30 seconds - for frequently changing data
  MEDIUM: 5 * 60_000, // 5 minutes - for semi-static data
  LONG: 30 * 60_000, // 30 minutes - for rarely changing data
  HOUR: 60 * 60_000, // 1 hour - for static data
} as const;
