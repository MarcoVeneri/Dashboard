const CACHE = "commute-dashboard-v38-future-ui-compact";
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

const COMPACT_UI = `
/* Traffico · compact space optimization */
@media(max-width:759px){
  .app{padding:max(8px,env(safe-area-inset-top)) 9px max(14px,env(safe-area-inset-bottom))!important}
  .app:before{margin:0 4px 5px!important;font-size:7.5px!important}

  .header{padding:10px 11px!important;margin-bottom:7px!important;border-radius:20px!important}
  .header>div:first-child{padding-left:42px!important}
  .header>div:first-child:before{width:33px!important;height:33px!important;border-radius:10px!important;font-size:18px!important;top:1px!important}
  h1:before{font-size:24px!important;margin-bottom:2px!important}
  h1{font-size:12px!important;margin:1px 0 3px!important}
  .eyebrow{font-size:7.5px!important}
  .meta{font-size:7.5px!important}
  .actions{gap:5px!important}
  .circle{width:36px!important;height:36px!important;border-radius:11px!important;font-size:15px!important}

  .directionSwitch{padding:4px!important;margin-bottom:7px!important;border-radius:16px!important;gap:4px!important}
  .directionBtn{min-height:36px!important;font-size:8.5px!important;padding:0 4px!important;border-radius:13px!important}

  .decision{min-height:0!important;height:auto!important;padding:11px 12px!important;border-radius:21px!important;margin-bottom:7px!important}
  .decisionTop{grid-template-columns:40px minmax(0,1fr) auto!important;gap:9px!important;align-items:center!important}
  .decisionIcon{width:40px!important;height:40px!important;border-radius:12px!important;font-size:20px!important}
  .decisionKicker{font-size:6.5px!important;letter-spacing:.14em!important}
  .decisionTitle{font-size:23px!important;line-height:.95!important;max-width:none!important;margin-top:2px!important;letter-spacing:-.045em!important}
  .decisionSub{font-size:8.5px!important;line-height:1.25!important;margin-top:4px!important;max-width:none!important}
  .live{position:relative!important;right:auto!important;top:auto!important;align-self:center!important;padding:5px 7px 5px 17px!important;font-size:6.5px!important}
  .live:before{left:7px!important;width:5px!important;height:5px!important}

  .routes{gap:6px!important}
  .route{min-height:0!important;padding:11px 12px 10px!important;border-radius:20px!important}
  .route:after{left:12px!important;right:12px!important}
  .routeName{font-size:7.5px!important;gap:7px!important}
  .routeName:before{width:27px!important;height:27px!important;border-radius:9px!important;font-size:9px!important}
  #normalCard .routeName:before{font-size:16px!important}
  .routeMain{margin-top:7px!important;gap:7px!important}
  .routeTime{font-size:50px!important}
  .routeUnit{font-size:8px!important;margin:0 0 4px 4px!important}
  .routeEta{font-size:23px!important}
  .routeEta span{font-size:6px!important;margin-bottom:3px!important}
  .routeStatus{margin-top:8px!important;padding:5px 8px!important;font-size:7.5px!important}
  .routeStatus:before{width:5px!important;height:5px!important}
  .routeDetail{margin-top:5px!important;font-size:8px!important;line-height:1.25!important}
  .trafficBar{margin-top:6px!important;height:4px!important}
  .diff{margin-top:4px!important;font-size:8.5px!important}

  .weather{gap:6px!important;margin-bottom:7px!important}
  .weatherCard{padding:8px 10px!important;border-radius:18px!important}
  .waze{min-height:46px!important;margin-top:7px!important;border-radius:16px!important}
  .note{margin-top:5px!important}
}

@media(max-width:380px){
  .decisionTitle{font-size:21px!important}
  .decisionTop{grid-template-columns:36px minmax(0,1fr) auto!important;gap:7px!important}
  .decisionIcon{width:36px!important;height:36px!important;font-size:18px!important}
  .routeTime{font-size:47px!important}
  .routeEta{font-size:21px!important}
}

@media(min-width:760px){
  .app:before{margin-bottom:8px!important}
  .header{padding:14px 16px!important;margin-bottom:10px!important}
  .directionSwitch{margin-bottom:10px!important}
  .decision{min-height:0!important;height:auto!important;align-self:start!important;padding:17px!important;border-radius:26px!important}
  .decisionTop{grid-template-columns:48px minmax(0,1fr) auto!important;gap:11px!important}
  .decisionIcon{width:48px!important;height:48px!important;border-radius:15px!important;font-size:23px!important}
  .decisionTitle{font-size:33px!important;line-height:.94!important}
  .decisionSub{margin-top:6px!important;font-size:10px!important;line-height:1.3!important}
  .routes{gap:8px!important}
  .route{min-height:0!important;padding:15px!important}
  .routeMain{margin-top:9px!important}
  .routeTime{font-size:58px!important}
  .routeEta{font-size:27px!important}
  .routeStatus{margin-top:9px!important}
  .routeDetail{margin-top:6px!important}
  .trafficBar{margin-top:7px!important}
  .diff{margin-top:5px!important}
}
`;

function cssResponse(css, baseResponse){
  const headers = new Headers(baseResponse ? baseResponse.headers : undefined);
  headers.set("Content-Type", "text/css; charset=utf-8");
  headers.set("Cache-Control", "no-store, max-age=0");
  return new Response(css + "\n" + COMPACT_UI, {
    status: baseResponse ? baseResponse.status : 200,
    statusText: baseResponse ? baseResponse.statusText : "OK",
    headers
  });
}

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

  // Applica sempre gli override compatti al tema futuristico senza toccare la logica della PWA.
  if (url.pathname.endsWith("/ios27.css")) {
    event.respondWith(
      fetch(event.request, {cache:"no-store"})
        .then(response => response.text().then(css => cssResponse(css, response)))
        .catch(() => caches.match(event.request).then(cached => {
          if (!cached) return cssResponse("", null);
          return cached.text().then(css => cssResponse(css, cached));
        }))
    );
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
