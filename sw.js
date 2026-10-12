const CACHE = "commute-dashboard-v38-future-ui";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./ios27.css?v=3",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png"
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
  const url = new URL(event.request.url);

  // Le API esterne devono restare sempre live.
  if (
    url.hostname.includes("tomtom.com") ||
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("waze.com")
  ) {
    return;
  }

  // HTML e navigazioni network-first per ricevere subito le nuove build.
  if (event.request.mode === "navigate" || url.pathname.endsWith(".html")) {
    event.respondWith(
      fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Asset statici: cache-first, con cache completamente rinnovata a ogni build.
  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
    )
  );
});
