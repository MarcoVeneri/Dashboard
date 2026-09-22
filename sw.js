const CACHE = "commute-dashboard-v38";
const ASSETS = [
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    url.hostname.includes("tomtom.com") ||
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("waze.com")
  ) {
    return;
  }

  const isPage = request.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/");

  if (isPage) {
    event.respondWith(
      fetch(request, {cache:"no-store"}).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request).then(cached => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, copy));
        return response;
      })
    )
  );
});