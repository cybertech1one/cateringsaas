const rateMap = new Map<string, { count: number; resetTime: number }>();

const CLEANUP_INTERVAL = 60_000; // 1 minute

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();

    for (const [key, value] of rateMap) {
      if (now > value.resetTime) {
        rateMap.delete(key);
      }
    }

    if (rateMap.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL);
}

/** Clear all rate-limit state. Used in tests. */
export function resetRateLimits(): void {
  rateMap.clear();
}

export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { success: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateMap.set(key, { count: 1, resetTime: now + windowMs });
    startCleanup();

    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;

  return { success: true, remaining: limit - entry.count };
}
