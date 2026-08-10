const C='roulette-v4-final';const A=['./','index.html','style.css','app.js','manifest.webmanifest','icon.svg','assets/8sa.png','assets/12sa.png','assets/16sa.png','assets/24sa.png','assets/32sa.png','assets/37sa.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(A)))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));