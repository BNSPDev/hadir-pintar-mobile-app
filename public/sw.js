const CACHE_NAME = "bnsp-epresensi-v2.1.4";
const STATIC_CACHE = "static-v2.1.4";

// Files to cache for offline support
const urlsToCache = ["/", "/login", "/manifest.json", "/placeholder.svg"];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log("Service Worker: Installed");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("Service Worker: Cache failed", error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip Supabase API requests (we want these to fail fast when offline)
  if (event.request.url.includes("supabase.co")) return;

  // Skip hot reload requests in development
  if (
    event.request.url.includes("/@vite/") ||
    event.request.url.includes("/node_modules/")
  )
    return;

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network
        return fetch(event.request).then((response) => {
          // Don't cache if not a valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          // Cache static resources
          if (
            event.request.url.match(
              /\.(js|css|html|png|jpg|jpeg|svg|ico|woff|woff2)$/,
            )
          ) {
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }

          return response;
        });
      })
      .catch(() => {
        // Return fallback page for navigation requests when offline
        if (event.request.mode === "navigate") {
          return caches.match("/");
        }
        return new Response("Offline", { status: 503 });
      }),
  );
});

// Handle background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    console.log("Service Worker: Background sync triggered");
    // Handle offline data sync here
  }
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Default notification",
    icon: "/placeholder.svg",
    badge: "/placeholder.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification("BNSP E-Presensi", options),
  );
});
