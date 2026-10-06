const CACHE_NAME = "syvaa-static-v1";
const OFFLINE_PAGE = "/offline.html";
const PRECACHE = [OFFLINE_PAGE, "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("syvaa-") && key !== CACHE_NAME).map((key) => caches.delete(key))),
      ),
      caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_PAGE).catch(() => undefined)),
    ]),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match(OFFLINE_PAGE)) || Response.error()));
    return;
  }

  if (!url.pathname.startsWith("/_next/static/") && !url.pathname.startsWith("/images/")) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") await cache.put(request, response.clone());
      return response;
    }),
  );
});
