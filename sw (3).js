const VER='multishop-v2';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VER).then(c=>Promise.all(SHELL.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // apni files: pehle internet se (taake update milti rahe), na ho to saved copy
    e.respondWith(fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(VER).then(c=>c.put(req,copy))}
      return res;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html'))));
  }else if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/')){
    // Firebase ki library: ek baar save, phir offline bhi chale
    e.respondWith(caches.match(req).then(r=>r||fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(VER).then(c=>c.put(req,copy))}
      return res;
    })));
  }
  // baqi sab (login, database) Firebase khud sambhalta hai
});
