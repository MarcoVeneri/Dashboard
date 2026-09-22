const CACHE="commute-dashboard-v39";
const STATIC=["./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
 const r=e.request,u=new URL(r.url);
 if(u.hostname.includes("tomtom.com")||u.hostname.includes("open-meteo.com")||u.hostname.includes("waze.com"))return;
 const page=r.mode==="navigate"||u.pathname.endsWith(".html")||u.pathname.endsWith("/");
 if(page){
  e.respondWith(fetch(r,{cache:"no-store"}).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(x=>x||caches.match("./v39.html"))));
  return;
 }
 e.respondWith(caches.match(r).then(x=>x||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
});