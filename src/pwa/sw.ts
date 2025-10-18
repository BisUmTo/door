/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;
declare const __ENABLE_CACHE__: boolean;

const CACHE_NAME = "gc-v1";
const PRECACHE_URLS = __ENABLE_CACHE__
  ? ["/", "/index.html", "/manifest.webmanifest"]
  : [];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  if (__ENABLE_CACHE__) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  if (!__ENABLE_CACHE__) {
    event.respondWith(fetch(new Request(request, { cache: "reload" })));
    return;
  }

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(request);
          cache.put("/index.html", networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await cache.match("/index.html");
          if (cached) return cached;
          throw new Error("Offline");
        }
      })()
    );
    return;
  }

  if (url.pathname.startsWith("/assets/") && request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached ?? networkFetch;
      })
    );
    return;
  }

  if (request.url.endsWith(".json")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const networkResponse = await fetch(request);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw new Error("Offline");
        }
      })()
    );
  }
});
