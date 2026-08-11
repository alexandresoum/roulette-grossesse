const C="roulette-v5-7-7-desktop-pro";
const A=["./","index.html","style.css","app.js","manifest.webmanifest","icon.svg",
"assets/28sa.png","assets/20sa.png","assets/10sa.png","assets/6sa.png","assets/8sa.png",
"assets/12sa.png","assets/16sa.png","assets/24sa.png","assets/32sa.png","assets/37sa.png"];

self.addEventListener("install",e=>{
 self.skipWaiting();
 e.waitUntil(caches.open(C).then(c=>c.addAll(A)));
});

self.addEventListener("activate",e=>{
 e.waitUntil(
   caches.keys()
     .then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k))))
     .then(()=>self.clients.claim())
 );
});

self.addEventListener("fetch",e=>{
 const r=e.request;
 if(r.method!=="GET")return;
 const u=new URL(r.url);
 const dynamic=u.pathname.endsWith("/") ||
   u.pathname.endsWith("/index.html") ||
   u.pathname.endsWith("/app.js") ||
   u.pathname.endsWith("/style.css");

 if(dynamic){
   e.respondWith(
     fetch(r,{cache:"no-store"})
       .then(resp=>{
         const copy=resp.clone();
         caches.open(C).then(c=>c.put(r,copy));
         return resp;
       })
       .catch(()=>caches.match(r))
   );
   return;
 }
 e.respondWith(caches.match(r).then(cached=>cached||fetch(r)));
});