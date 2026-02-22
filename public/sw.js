// FeastQR Service Worker
// Strategy: network-first for menu data, cache-first for static assets

const CACHE_NAME = "feastqr-v1";
const STATIC_CACHE = "feastqr-static-v1";

// Static assets to pre-cache on install
const PRECACHE_URLS = ["/manifest.json", "/icons/icon-192x192.svg", "/icons/icon-512x512.svg"];

// Patterns for static assets (cache-first)
const STATIC_PATTERNS = [
  /\.(js|css|woff2?|ttf|eot|svg|png|jpe?g|webp|avif|ico)$/i,
  /\/_next\/static\//,
  /\/icons\//,
  /\/images\//,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/,
];

// Patterns for menu pages (network-first with cache fallback)
const MENU_PATTERNS = [/\/menu\/[^/]+$/];

// Patterns to never cache
const NEVER_CACHE_PATTERNS = [
  /\/api\//,
  /\/trpc\//,
  /supabase/,
  /\/login/,
  /\/register/,
  /\/dashboard/,
  /\/reset-password/,
  /chrome-extension/,
];

// ── Install ──────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ── Activate ─────────────────────────────────────────────────────

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ── Fetch ────────────────────────────────────────────────────────

function matchesAny(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// Network-first: try network, fall back to cache
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {

      return cachedResponse;
    }

    // Return a simple offline page if nothing is cached

    return new Response(
      '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><style>body{font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#faf5f0;color:#333}div{text-align:center;padding:2rem}.icon{font-size:3rem;margin-bottom:1rem}h1{font-size:1.25rem;margin:0 0 0.5rem}p{color:#666;margin:0}</style></head><body><div><div class="icon">&#127860;</div><h1>You\'re offline</h1><p>Please check your internet connection and try again.</p></div></body></html>',
      {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      },
    );
  }
}

// Cache-first: try cache, fall back to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);

      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (_error) {
    return new Response("", { status: 408 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip non-http(s) requests
  if (!url.startsWith("http")) return;

  // Never cache API/auth routes
  if (matchesAny(url, NEVER_CACHE_PATTERNS)) return;

  // Menu pages: network-first
  if (matchesAny(url, MENU_PATTERNS)) {
    event.respondWith(networkFirst(request));

    return;
  }

  // Static assets: cache-first
  if (matchesAny(url, STATIC_PATTERNS)) {
    event.respondWith(cacheFirst(request));

    return;
  }

  // Navigation requests (HTML pages): network-first
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));

    return;
  }
});

// ── Push notifications ──────────────────────────────────────────

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Order Update";
  const options = {
    body: data.body || "Your order status has been updated",
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/icon-192x192.svg",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
    tag: "order-status-update",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window with the same URL is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      // Otherwise open a new window
      return clients.openWindow(url);
    }),
  );
});

// ── Message handler for skip waiting ─────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
